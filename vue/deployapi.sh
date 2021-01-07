#!/bin/bash
PIHOST=$(cat pihost)
rsync -rl --inplace public/api/ "$PIHOST:/var/www/html/public/api"
rsync -rl --inplace ../includes/ "$PIHOST:/var/www/html/includes"
