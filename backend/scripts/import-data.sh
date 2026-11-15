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

echo "importing creating modis spatial index..."
duckdb data/data.duckdb -c "load spatial; create index viirs_location_idx on viirs using rtree (location)"

# testing

echo "testing spatial queries..."
duckdb data/data.duckdb -c "load spatial; select count(*) from modis where st_distance(location, st_point(50.684799, -120.351443)) < 0.25 limit 5"
duckdb data/data.duckdb -c "load spatial; select count(*) from viirs where st_distance(location, st_point(50.684799, -120.351443)) < 0.25 limit 5"
