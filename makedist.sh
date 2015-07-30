#!/usr/bin/env bash

mvn clean package
rm -Rf ./dist/*

mkdir dist/lib

cp target/*-with-dependencies.jar dist/lib/
cp -r web dist/web
cp -r bower_components dist/bower_components
cp app.kson dist
cp run.sh dist

zip -r dist.zip dist