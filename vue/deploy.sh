#!/bin/bash
PIHOST=$(cat pihost)
rsync -rl --inplace ../public/ "$PIHOST:/var/www/html/public"
