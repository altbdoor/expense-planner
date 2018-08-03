#!/bin/bash

hash=$(git log -1 --pretty=format:%h)

if [[ ! -f "app_${hash}.appcache" ]]; then
    mv app_*.appcache "app_${hash}.appcache"
fi

if [[ ! -f "static/angular_${hash}.js" ]]; then
    mv static/angular_*.js "static/angular_${hash}.js"
fi

sed -i -e "s/app_[[:alnum:]]*.appcache/app_${hash}.appcache/" index.html

sed -i -e "s/angular_[[:alnum:]]*.js/angular_${hash}.js/" index.html
sed -i -e "s/angular_[[:alnum:]]*.js/angular_${hash}.js/" "app_${hash}.appcache"
