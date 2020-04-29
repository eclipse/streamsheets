#!/usr/bin/env bash


FROM=$1
TO=$2

find packages -path '*/node_modules' -prune -o -name package.json \
	-exec sed -i 's_"version": "'$FROM'"_"version": "'$TO'"_g' {} \; \
	-exec sed -i 's_"\(\@cedalo/[^"]*\)": "'$FROM'"_"\1": "'$TO'"_g' {} \;
