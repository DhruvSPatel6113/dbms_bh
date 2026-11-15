#!/bin/bash
service postgresql start
su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
su - postgres -c "psql -c \"DROP DATABASE IF EXISTS library_dev;\""
su - postgres -c "psql -c \"DROP DATABASE IF EXISTS library_test;\""
su - postgres -c "psql -c \"CREATE DATABASE library_dev;\""
su - postgres -c "psql -c \"CREATE DATABASE library_test;\""
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/16/main/pg_hba.conf
echo "host all all ::/0 md5" >> /etc/postgresql/16/main/pg_hba.conf
service postgresql restart
service postgresql status

