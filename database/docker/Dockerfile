# PostgreSQL 18 Custom Dockerfile
# This Dockerfile can be used for custom PostgreSQL configurations if needed
# Currently, we use the official postgres:18 image directly in docker-compose.yml

FROM postgres:18

# Install additional PostgreSQL extensions if needed
# RUN apt-get update && apt-get install -y \
#     postgresql-contrib \
#     && rm -rf /var/lib/apt/lists/*

# Set default locale
ENV LANG=en_US.utf8

# Expose PostgreSQL port
EXPOSE 5432

# The init.sql script will be automatically executed on first run
# via the docker-compose volume mount to /docker-entrypoint-initdb.d/
