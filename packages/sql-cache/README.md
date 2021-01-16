# Testing

```bash
# Start postgres and mysql
docker run -d --name sql-cache-test-postgres -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:alpine
docker run -d --name sql-cache-test-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass mysql:5

# Test
POSTGRES_URL=postgres://postgres@localhost MYSQL_URL=mysql://root:pass@localhost npm run test

# Cleanup
docker rm -f sql-cache-test-{postgres,mysql}
```
