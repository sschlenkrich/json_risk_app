from nginx

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
   php \
   php-fpm \
   nodejs \
   sudo \
   wget \
   vim \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# specify json_risk release tag here
RUN wget https://github.com/frame-consulting/json_risk_app/releases/download/v1.0.2/jr.tar.gz
#
RUN mkdir /json_risk_app
RUN tar -xzf jr.tar.gz --directory /json_risk_app
RUN rm jr.tar.gz

# specify json_risk config file here
COPY ../.config /json_risk_app

# json_risk requires a user to run
RUN useradd -ms /bin/bash celery
RUN chown -R celery /json_risk_app

# start server via docker entry point
COPY entry_point_script.sh .
ENTRYPOINT /entry_point_script.sh
