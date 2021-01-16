# Testing

```bash
# Start postgres and mysql
docker run -d --name sql-cache-test-postgres -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:alpine
docker run -d --name sql-cache-test-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass mysql:5

# Test
TEST_URL_1=postgres://postgres@localhost/postgres TEST_URL_2=mysql://root:pass@localhost/mysql npm run test

# Cleanup
docker rm -f sql-cache-test-{postgres,mysql}
```
