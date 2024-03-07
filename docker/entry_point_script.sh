#!/bin/sh

#
# shutdown jsonrisk when container is stopped
#

cleanup(){
    echo "$(date '+%Y-%m-%d %H-%M-%S') INFO : Container was requested to shut down"
    su jsonrisk -c ./jr_stop    
}

trap cleanup TERM

#
# derive UIDs and GIDs from mounted data directory
#
if [ -w /data ]; then # if data is writable, it has been mounted, otherwise it would be immutable
    TARGET_UID=$(stat -c "%u" /data)
    TARGET_GID=$(stat -c "%g" /data)
    # copy config files from data dir in this case
    for CONFIGFILE in /data/.config /data/.security.json /data/.cluster.json; do
        [ -f $CONFIGFILE ] && cp $CONFIGFILE /app
    done
elif [ -d /app/.var ]; then # /app has been mounted, e.g. for development
    TARGET_UID=$(stat -c "%u" /app/.var)
    TARGET_GID=$(stat -c "%g" /app/.var)
elif [ -f /app/.config ];then # /app was mounted, e.g. for development
    TARGET_UID=$(stat -c "%u" /app/.config)
    TARGET_GID=$(stat -c "%g" /app/.config)
else
    TARGET_UID=999
    TARGET_GID=999
fi

[ -z $TARGET_UID ] && TARGET_UID=999
[ -z $TARGET_GID ] && TARGET_GID=999

echo "$(date '+%Y-%m-%d %H-%M-%S') INFO : Target UID is $TARGET_UID"
echo "$(date '+%Y-%m-%d %H-%M-%S') INFO : Target GID is $TARGET_GID"


#
# modify container user and container group to match data ownership
#
usermod -u "$TARGET_UID" jsonrisk
groupmod -g "$TARGET_UID" jsonrisk

#
# update ownership on /app directory
#
#chown -R jsonrisk:jsonrisk /app

#
# start application
#
cd /app
su jsonrisk -c ./jr_start

#
# workaround to prevent container to exit but still receive TERM signal when container is stopped
#
tail -f /dev/null &
wait $!
