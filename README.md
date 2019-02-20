# Deno Module Registry

[![Build Status](https://travis-ci.com/denoland/registry.svg?branch=master)](https://travis-ci.com/denoland/registry)

This is the webserver and database for the https://deno.land/x/ service.

This service allows people to create pretty URLs which redirect to github (or
other content). For example:

```
deno -A https://deno.land/x/std@v0.2.7/http/file_server.ts
```
