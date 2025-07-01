# Use an official PostgreSQL base image
FROM postgres:14-alpine

# Set environment variables
ENV POSTGRES_USER=yourusername \
    POSTGRES_PASSWORD=yourpassword \
    POSTGRES_DB=mydb

# Expose the PostgreSQL port
EXPOSE 5432

# Start the PostgreSQL service when the container runs
CMD ["postgres", "-c", "shared_preload_libraries='pg_stat_statements'"]