#!/bin/bash
PIHOST=$(cat pihost)
rsync -rl --inplace --exclude '.git' --filter=':- .gitignore' ../ "$PIHOST:/var/www/html"
