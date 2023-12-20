#
# functions
#

jr_log(){
	echo "$(date '+%Y-%m-%d %H:%M:%S') INFO : $@"
}

jr_log_n(){
	echo -n "$(date '+%Y-%m-%d %H:%M:%S') INFO : $@"
}

jr_warn(){
	echo "$(date '+%Y-%m-%d %H:%M:%S') WARN : $@"
}

jr_fail(){
	echo "$(date '+%Y-%m-%d %H:%M:%S') FATAL: $@"
	[ -n "$TMPFILE" ] && rm -f "$TMPFILE"
	exit 1
}

wait_for_pid () {
    TRY=0
    jr_log_n "Waiting for process to $1..."
    while test $TRY -lt 20 ; do
        case "$1" in
            'start')
            if [ -f "$2" ] ; then
                TRY=''
                break
            fi
            ;;

            'stop')
            if [ ! -f "$2" ] ; then
                TRY=''
                break
            fi
            ;;
        esac

        echo -n .
        TRY=`expr $TRY + 1`
        sleep 1
    done
    echo
    [ -n "$TRY" ] && return 1
    return 0
}

config_template(){
	sed -e "s#{{JR_ROOT}}#${JR_ROOT//#/\\#}#g" \
		-e "s#{{JR_HOSTNAME}}#${JR_HOSTNAME//#/\\#}#g" \
		-e "s#{{JR_PORT}}#${JR_PORT//#/\\#}#g" \
		-e "s#{{JR_DATADIR}}#${JR_DATADIR//#/\\#}#g" \
		-e "s#{{JR_SECRET}}#${JR_SECRET//#/\\#}#g" \
		-e "s#{{JR_TMPDIR}}#${JR_TMPDIR//#/\\#}#g" \
		< $1
}

start_nginx(){

	if [ -f "$JR_PID_NGINX" ]; then
		jr_warn "nginx already running"
		return 0
	fi
	TMPFILE=`mktemp`
	chmod 600 "$TMPFILE"
	config_template "$JR_ROOT/res/templates/nginx.conf" > "$TMPFILE"

	"$JR_NGINX" -q -c "$TMPFILE" || jr_fail "Could not start nginx. Check config file."
	rm -f "$TMPFILE"

	wait_for_pid start "$JR_PID_NGINX" || jr_fail "Could not start nginx. Check config file."
	jr_log "Successfully started nginx."
}

stop_nginx(){
    if [ ! -r "$JR_PID_NGINX" ] ; then
        jr_warn "No pidfile found for nginx. Is nginx running at all?"
        return 0
    fi

    kill -QUIT `cat "$JR_PID_NGINX"`
	jr_log "Shutdown request sent to nginx."
        wait_for_pid stop "$JR_PID_NGINX" || jr_fail "Could not stop nginx. Find and terminate the process manually."
	jr_log "Successfully stopped nginx."
}

start_phpfpm(){

	if [ -f "$JR_PID_PHPFPM" ]; then
		jr_warn "php-fpm already running"
		return 0
	fi
	TMPFILE=`mktemp`
	chmod 600 "$TMPFILE"
	config_template "$JR_ROOT/res/templates/php-fpm.conf" > "$TMPFILE"

	"$JR_PHPFPM" -D -y "$TMPFILE" -c "$JR_ROOT/res/php/php.ini" || jr_fail "Could not start php-fpm. Check config file."
	rm -f "$TMPFILE"

	wait_for_pid start "$JR_PID_PHPFPM" || jr_fail "Could not start php-fpm. Check config file."
	jr_log "Sucessfully started php-fpm."
}

stop_phpfpm(){
    if [ ! -r "$JR_PID_PHPFPM" ] ; then
        jr_warn "No pidfile found for php-fpm. Is php-fpm running at all?"
        return 0
    fi

    kill -QUIT `cat "$JR_PID_PHPFPM"`
	jr_log "Shutdown request sent to php-fpm."
    wait_for_pid stop "$JR_PID_PHPFPM" || jr_fail "Could not stop php-fpm. Find and terminate the process manually."
	jr_log "Sucessfully stopped php-fpm."
}

start_agent(){
	if [ -f "$JR_PID_AGENT" ]; then
		jr_warn "agent already running"
		return 0
	fi
	rm -f "${JR_TMPDIR}/agent.sock"

	(
        (
            while true;do
                "${JR_NODEJS}" "${JR_ROOT}/res/js/agent.js" >> "${JR_TMPDIR}/agent.log" 2>&1
                RETVAL=$?
                [ "$RETVAL" -eq 0 ] && break
                rm -f "${JR_TMPDIR}/agent.sock"
                sleep 1
            done
        )&
    )


    rm -f "$TMPFILE"

	wait_for_pid start "$JR_PID_AGENT" || jr_fail "Could not start agent."
	jr_log "Successfully started agent."
}

stop_agent(){
    if [ ! -r "$JR_PID_AGENT" ] ; then
        jr_warn "No pidfile found for agent. Is agent running at all?"
        return 0
    fi

    kill -QUIT `cat "$JR_PID_AGENT"`
	jr_log "Shutdown request sent to agent."
    if ! wait_for_pid stop "$JR_PID_AGENT";then
		rm -f "${JR_TMPDIR}/agent.sock"
		jr_fail "Could not stop agent. Find and terminate the process manually."
	fi
	jr_log "Successfully stopped agent."
}

export JR_ROOT

#
# read custom config
#
[ -f "$JR_ROOT/.config" ] && source "$JR_ROOT/.config"

#
# set defaults
#
[ -z "$JR_HOSTNAME" ] && JR_HOSTNAME=`hostname`
[ -z "$JR_PORT" ] && JR_PORT=8080

#
# detect nginx
#

[ -z "$JR_NGINX" ] && JR_NGINX=`PATH="/usr/sbin:$PATH" which nginx ` 
[ -z "$JR_NGINX" ] && jr_fail "Could not detect path to nginx binary. Set JR_NGINX explicitly in .config."

#
# detect php
#

[ -z "$JR_PHP" ] && JR_PHP=`PATH="/usr/sbin:$PATH" which php ` 
[ -z "$JR_PHP" ] && jr_fail "Could not detect path to php binary. Set JR_PHP explicitly in .config."


#
# detect php-fpm
#
for v in 7.0 7.1 7.2 7.3 7.4 8.0 8.1 8.2 8.3;do
	[ -z "$JR_PHPFPM" ] && JR_PHPFPM=`PATH="/usr/sbin:$PATH" which "php-fpm$v" ` 
done
[ -z "$JR_PHPFPM" ] && jr_fail "Could not detect path to php-fpm binary. Set JR_PHPFPM explicitly in .config."

#
# detect node js
#

[ -z "$JR_NODEJS" ] && JR_NODEJS=`PATH="/usr/sbin:$PATH" which node ` 
[ -z "$JR_NODEJS" ] && jr_fail "Could not detect path to node js binary. Set JR_NODEJS explicitly in .config."



#
# read JR_SECRET from .security.json
#
[ -f "$JR_ROOT/.security.json" ] && JR_SECRET=$(cd $JR_ROOT/res/js;"$JR_NODEJS" -e "console.log(require('./auth.js').secret());")
[ -z "$JR_SECRET" ] && JR_SECRET="NOT SECRET"
[ "x$JR_SECRET" == "xNOT SECRET" ] && jr_warn "The secret property is not set in .security.json. This is a security vulnerability. It is strictly recommended to set this property."

#
# check valid hostname
#

#
# set tmpdir
#

[ -z "$JR_TMPDIR" ] && JR_TMPDIR="/tmp/jr_$JR_HOSTNAME"

JR_PID_NGINX="$JR_TMPDIR/nginx.pid"
JR_PID_PHPFPM="$JR_TMPDIR/php-fpm.pid"
JR_PID_AGENT="$JR_TMPDIR/agent.pid"

#
# set datadir
#

[ -z "$JR_DATADIR" ] && JR_DATADIR="$JR_ROOT/.var"


#
# make dirs if nonexistent
#

mkdir -p "$JR_TMPDIR"
mkdir -p "$JR_DATADIR"

[ -w "$JR_TMPDIR" ] || jr_fail "The temp dir $JR_TMPDIR is not writable"
[ -w "$JR_DATADIR" ] || jr_fail "The data dir $JR_DATADIR is not writable"

export JR_TMPDIR
export JR_DATADIR
export JR_HOSTNAME
export JR_PORT
