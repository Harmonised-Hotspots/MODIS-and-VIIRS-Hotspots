#! /usr/bin/env bash

# Usage: ./scripts/import-data.sh [num_years=3]

NUM_YEARS=${1:-8}
END_YEAR=2025

if [ -e data/data.duckdb ]; then
	read -e -p "data/data.duckdb already exists. Do you want to delete and recreate the database? [y/N]: " choice
	if [ "$choice" == "y" ]; then
		echo "deleting existing database..."
		rm data/data.duckdb > /dev/null
	else
		exit
	fi
fi

echo "creating database..."
duckdb -no-stdin data/data.duckdb

echo "installing spatial extension..."
duckdb data/data.duckdb -c "install spatial"

pushd data > /dev/null
for i in `seq 0 $(($NUM_YEARS - 1))`; do
	year=$(($END_YEAR - $i))

	filename="modis_${year}_Canada.csv"
	if [ ! -e "$filename" ]; then
		echo "downloading $filename..."
		curl -s "https://firms.modaps.eosdis.nasa.gov/data/country/modis/$year/$filename" -o "$filename"
	else
		echo "$filename already exists"
	fi

	filename="viirs-jpss1_${year}_Canada.csv"
	if [ ! -e "$filename" ]; then
		echo "downloading $filename..."
		curl -s "https://firms.modaps.eosdis.nasa.gov/data/country/viirs-jpss1/$year/$filename" -o "$filename"
	else
		echo "$filename already exists"
	fi
done
popd > /dev/null

# modis data

echo "importing modis data for $END_YEAR..."
duckdb data/data.duckdb -c "create table modis as select * from read_csv('data/modis_${END_YEAR}_Canada.csv')"
for i in `seq 1 $(($NUM_YEARS - 1))`; do
	year=$(($END_YEAR - $i))
	echo "importing modis data for $year..."
	duckdb data/data.duckdb -c "insert into modis select * from read_csv('data/modis_${year}_Canada.csv')"
done

echo "adding modis location column..."
duckdb data/data.duckdb -c "alter table modis add column location geometry"
duckdb data/data.duckdb -c "load spatial; update modis set location=st_point(latitude, longitude)"

echo "importing creating modis spatial index..."
duckdb data/data.duckdb -c "load spatial; create index modis_location_idx on modis using rtree (location)"

# viirs data

echo "importing viirs data for $END_YEAR..."
duckdb data/data.duckdb -c "create table viirs as select * from read_csv('data/viirs-jpss1_${END_YEAR}_Canada.csv')"
for i in `seq 1 $(($NUM_YEARS - 1))`; do
	year=$(($END_YEAR - $i))
	echo "importing viirs data for $year..."
	duckdb data/data.duckdb -c "insert into viirs select * from read_csv('data/viirs-jpss1_${year}_Canada.csv')"
done

echo "adding viirs location column..."
duckdb data/data.duckdb -c "alter table viirs add column location geometry"
duckdb data/data.duckdb -c "load spatial; update viirs set location=st_point(latitude, longitude)"

echo "importing creating viirs spatial index..."
duckdb data/data.duckdb -c "load spatial; create index viirs_location_idx on viirs using rtree (location)"

# harmonization

echo "building harmonized_hotspots table (1km grid + 7.5 MW sensitivity floor + schedule deduplication)..."
duckdb data/data.duckdb -c "
load spatial;
create or replace table harmonized_hotspots as
with viirs_grid as (
    select
        acq_date,
        daynight,
        round(latitude, 2) as latitude,
        round(longitude, 2) as longitude,
        round(avg(bright_ti4), 1) as brightness,
        round(0.732 * sum(frp) + 1.14 * (count(*) * 0.14), 1) as frp,
        round(avg(case confidence when 'h' then 95 when 'n' then 75 else 30 end))::integer as confidence,
        max(type) as type,
        count(*) as pixel_count,
        (
            (bool_and(confidence = 'l') and count(*) = 1)
            or (0.732 * sum(frp) + 1.14 * (count(*) * 0.14)) < 7.5
        ) as is_ghost,
        'VIIRS_HARMONIZED' as sensor
    from viirs
    group by acq_date, daynight, round(latitude, 2), round(longitude, 2)
),
modis_grid as (
    select
        acq_date,
        daynight,
        round(latitude, 2) as latitude,
        round(longitude, 2) as longitude,
        round(avg(brightness), 1) as brightness,
        round(max(frp), 1) as frp,
        max(confidence)::integer as confidence,
        min(type) as type,
        count(*) as pixel_count,
        (bool_and(type != 0) or max(frp) < 7.5) as is_ghost,
        'MODIS_C61' as sensor
    from modis
    group by acq_date, daynight, round(latitude, 2), round(longitude, 2)
),
combined as (
    select * from viirs_grid
    union all
    select * from modis_grid
)
select
    latitude,
    longitude,
    round(avg(brightness), 1) as brightness,
    acq_date,
    daynight,
    round(max(frp), 1) as frp,
    max(confidence)::integer as confidence,
    min(type) as type,
    sum(pixel_count)::integer as pixel_count,
    bool_and(is_ghost) as is_ghost,
    case
        when count(distinct sensor) > 1 then 'MODIS_VIIRS_SYNTH'
        else max(sensor)
    end as sensor,
    st_point(latitude, longitude) as location
from combined
group by acq_date, daynight, latitude, longitude;
create index harmonized_location_idx on harmonized_hotspots using rtree (location);
"

# testing

echo "testing spatial queries..."
duckdb data/data.duckdb -c "load spatial; select count(*) from modis where st_distance(location, st_point(50.684799, -120.351443)) < 0.25 limit 5"
duckdb data/data.duckdb -c "load spatial; select count(*) from viirs where st_distance(location, st_point(50.684799, -120.351443)) < 0.25 limit 5"
duckdb data/data.duckdb -c "load spatial; select count(*) from harmonized_hotspots where is_ghost = false and st_distance(location, st_point(50.684799, -120.351443)) < 0.25"
