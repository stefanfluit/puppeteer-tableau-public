#!/usr/bin/env bash

val=$(docker image ls | grep "nodejs:image")
if [ ! "${val}" ]
then
    echo "its here"
else
    echo "its not"
fi