#! /usr/bin/env bash

DUCKDB=~/AppData/Local/duckdb/cli/2.0.0/duckdb.exe

rm data/data2.duckdb
$DUCKDB -no-stdin data/data2.duckdb
$DUCKDB data/data2.duckdb -c "install spatial"
$DUCKDB data/data2.duckdb -c "create table modis as select * from read_csv('data/modis_2024_Canada.csv')"
$DUCKDB data/data2.duckdb -c "insert into modis select * from read_csv('data/modis_2025_Canada.csv')"
$DUCKDB data/data2.duckdb -c "alter table modis add column location geometry"
$DUCKDB data/data2.duckdb -c "load spatial; update modis set location=st_point(latitude, longitude)"
$DUCKDB data/data2.duckdb -c "load spatial; create index modis_location_idx on modis using rtree (location)"

$DUCKDB data/data2.duckdb -c "create table viirs as select * from read_csv('data/viirs-jpss1_2024_Canada.csv')"
$DUCKDB data/data2.duckdb -c "insert into viirs select * from read_csv('data/viirs-jpss1_2025_Canada.csv')"
$DUCKDB data/data2.duckdb -c "alter table viirs add column location geometry"
$DUCKDB data/data2.duckdb -c "load spatial; update viirs set location=st_point(latitude, longitude)"
$DUCKDB data/data2.duckdb -c "load spatial; create index viirs_location_idx on viirs using rtree (location)"

$DUCKDB data/data2.duckdb -c "load spatial; select * from modis where st_distance(location, st_point(50.684799, -120.351443)) < 0.5"
