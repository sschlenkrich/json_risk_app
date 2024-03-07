FROM ubuntu:jammy

# install dependencies

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends --no-install-suggests \
   php \
   php-fpm \
   nginx-light \
   wget \
   curl \
   ca-certificates \
   vim \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# nodejs version from official repository is too old, use LTS version 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends --no-install-suggests nodejs

# json_risk requires a user to run
RUN groupadd -r -g 999 jsonrisk; \
    useradd -ms /bin/bash -g 999 jsonrisk

# specify json_risk release tag here
RUN wget https://github.com/frame-consulting/json_risk_app/releases/download/v1.0.2/jr.tar.gz \
    && mkdir /app \
    && tar -xzf jr.tar.gz --directory /app \
    && rm jr.tar.gz \
    && chown -R jsonrisk:jsonrisk /app \
    && chmod +x /app/jr_*

# start server via docker entry point
COPY entry_point_script.sh /entry_point_script.sh
RUN chmod +x /entry_point_script.sh
ENTRYPOINT ["/entry_point_script.sh"]
