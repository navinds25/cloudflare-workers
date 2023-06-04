ENCODED_USER_PASS=""
LOCAL_URL=http://127.0.0.1:8787
#URL=https:// .workers.dev/
echo "post url pair"
echo "curl -XPOST ${URL}/pair -H 'Authorization: Basic ${ENCODED_USER_PASS}' -H 'application/json' -d '{\"shortUrl\": \"shortUrl.n25tech.com\", \"longUrl\": \"longUrl.n25tech.com\"}'"
echo "post gen"
echo "curl -XPOST ${URL}/gen -H 'Authorization: Basic ${ENCODED_USER_PASS}' -H 'application/json' -d '{\"longUrl\": \"longUrl.n25tech.com\"}'"
