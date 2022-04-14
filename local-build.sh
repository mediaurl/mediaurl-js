#!/bin/sh -ex
while [ "$1" != "" ]; do
	npx lerna run build --scope @mediaurl/$1
	npx lerna exec --scope @mediaurl/$1 -- npm pack
	shift
done
