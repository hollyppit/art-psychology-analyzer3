---
url: 'https://developers-apps-in-toss.toss.im/development/integration-process.md'
description: >-
  앱인토스 API 사용을 위한 mTLS 기반 서버 간 통신 설정 가이드입니다. 인증서 발급, 통신 구조, 언어별 API 요청 예제를
  확인하세요.
---

# API 사용하기

앱인토스 API를 사용하려면 **mTLS 기반의 서버 간(Server-to-Server) 통신 설정이 반드시 필요해요.**\
mTLS 인증서는 파트너사 서버와 앱인토스 서버 간 통신을 **암호화**하고 **쌍방 신원을 상호 검증**하는 데 사용됩니다.

::: tip 아래 기능은 반드시 mTLS 인증서를 통한 통신이 필요해요

* [토스 로그인](/login/intro.md)
* [토스 페이](/tosspay/intro.md)
* [인앱 결제](/iap/intro.md)
* [기능성 푸시, 알림](/smart-message/intro.md)
* [프로모션(토스 포인트)](/promotion/intro.md)
  :::

## 통신 구조

앱인토스 API는 파트너사 서버에서 앱인토스 서버로 요청을 전송하고,\
앱인토스 서버가 토스 서버에 연동 요청을 전달하는 구조로 동작해요.

![](/assets/appintoss_process_2.DkmHrB4Z.png)

![](../resources/prepare/appintoss_process.png)

## mTLS 인증서 발급 방법

서버용 mTLS 인증서는 **콘솔에서 직접 발급**할 수 있어요.

### 1. 앱 선택하기

앱인토스 콘솔에 접속해 인증서를 발급받을 앱을 선택하세요.\
왼쪽 메뉴에서 **mTLS 인증서** 탭을 클릭한 뒤, **+ 발급받기** 버튼을 눌러 발급을 진행해요.

![](/assets/mtls.C_guSa2X.png)

### 2. 인증서 다운로드 및 보관

mTLS 인증서가 발급되면 **인증서 파일과 키 파일**을 다운로드할 수 있어요.

::: tip 보관 시 주의하세요

* 인증서와 키 파일은 유출되지 않도록 **안전한 위치에 보관**하세요.
* 인증서가 **만료되기 전에 반드시 재발급**해 주세요.

:::

![](/assets/mtls-2._GxAfDcf.png)

콘솔에서 발급된 인증서는 아래와 같이 확인할 수 있어요.

![](/assets/mtls-3.CkETJCHm.png)

인증서는 일반적으로 하나만 사용하지만, **무중단 교체**를 위해 **두 개 이상 등록해 둘 수도 있어요.**\
콘솔에서는 이를 위해 **다중 인증서 관리 기능을** 제공해요.

## API 요청 시 인증서 설정

앱인토스 서버에 요청하려면, 발급받은 **인증서/키 파일**을 서버 애플리케이션에 등록해야 해요.

아래는 주요 언어별 mTLS 요청 예제예요.\
환경에 맞게 경로, 알고리즘, TLS 버전 등을 조정하세요.

::: details Kotlin 예제

```kotlin
import java.security.KeyStore
import java.security.cert.X509Certificate
import java.security.KeyFactory
import java.security.spec.PKCS8EncodedKeySpec
import java.io.FileReader
import java.io.ByteArrayInputStream
import java.util.Base64
import javax.net.ssl.*

class TLSClient {
    fun createSSLContext(certPath: String, keyPath: String): SSLContext {
        val cert = loadCertificate(certPath)
        val key = loadPrivateKey(keyPath)

        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(null, null)
        keyStore.setCertificateEntry("client-cert", cert)
        keyStore.setKeyEntry("client-key", key, "".toCharArray(), arrayOf(cert))

        val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        kmf.init(keyStore, "".toCharArray())

        return SSLContext.getInstance("TLS").apply {
            init(kmf.keyManagers, null, null)
        }
    }

    private fun loadCertificate(path: String): X509Certificate {
        val content = FileReader(path).readText()
            .replace("-----BEGIN CERTIFICATE-----", "")
            .replace("-----END CERTIFICATE-----", "")
            .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(content)
        return CertificateFactory.getInstance("X.509")
            .generateCertificate(ByteArrayInputStream(bytes)) as X509Certificate
    }

    private fun loadPrivateKey(path: String): java.security.PrivateKey {
        val content = FileReader(path).readText()
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(content)
        val spec = PKCS8EncodedKeySpec(bytes)
        return KeyFactory.getInstance("RSA").generatePrivate(spec)
    }

    fun makeRequest(url: String, context: SSLContext): String {
        val connection = (URL(url).openConnection() as HttpsURLConnection).apply {
            sslSocketFactory = context.socketFactory
            requestMethod = "GET"
            connectTimeout = 5000
            readTimeout = 5000
        }

        return connection.inputStream.bufferedReader().use { it.readText() }.also {
            connection.disconnect()
        }
    }
}

fun main() {
    val client = TLSClient()
    val context = client.createSSLContext("/path/to/client-cert.pem", "/path/to/client-key.pem")
    val response = client.makeRequest("https://apps-in-toss-api.toss.im/endpoint", context)
    println(response)
}
```

:::

::: details Python 예제

```python
import requests

class TLSClient:
    def __init__(self, cert_path, key_path):
        self.cert_path = cert_path
        self.key_path = key_path

    def make_request(self, url):
        response = requests.get(
            url,
            cert=(self.cert_path, self.key_path),
            headers={'Content-Type': 'application/json'}
        )
        return response.text

if __name__ == '__main__':
    client = TLSClient(
        cert_path='/path/to/client-cert.pem',
        key_path='/path/to/client-key.pem'
    )
    result = client.make_request('https://apps-in-toss-api.toss.im/endpoint')
    print(result)
```

:::

::: details JavaScript(Node.js) 예제

```js
const https = require('https');
const fs = require('fs');

const options = {
  cert: fs.readFileSync('/path/to/client-cert.pem'),
  key: fs.readFileSync('/path/to/client-key.pem'),
  rejectUnauthorized: true,
};

const req = https.request(
  'https://apps-in-toss-api.toss.im/endpoint',
  { method: 'GET', ...options },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('Response:', data);
    });
  }
);

req.on('error', (e) => console.error(e));
req.end();
```

:::

::: details C# 예제

```c#
using System;
using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

class Program {
    static async Task Main(string[] args) {
        var handler = new HttpClientHandler();
        handler.ClientCertificates.Add(
            new X509Certificate2("/path/to/client-cert.pem")
        );

        using var client = new HttpClient(handler);
        var response = await client.GetAsync("https://apps-in-toss-api.toss.im/endpoint");
        string body = await response.Content.ReadAsStringAsync();
        Console.WriteLine(body);
    }
}
```

:::

::: details C++ 예제(libcurl 사용)

```cpp
#include <curl/curl.h>
#include <iostream>
#include <string>

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

int main() {
    CURL* curl = curl_easy_init();
    if (curl) {
        std::string response;
        curl_easy_setopt(curl, CURLOPT_URL, "https://apps-in-toss-api.toss.im/endpoint");
        curl_easy_setopt(curl, CURLOPT_SSLCERT, "/path/to/client-cert.pem");
        curl_easy_setopt(curl, CURLOPT_SSLKEY, "/path/to/client-key.pem");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        CURLcode res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            std::cout << "Response: " << response << std::endl;
        } else {
            std::cerr << "Error: " << curl_easy_strerror(res) << std::endl;
        }

        curl_easy_cleanup(curl);
    }

    return 0;
}
```

:::

## 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: "`ERR_NETWORK` 에러가 발생해요.",
a: \`mTLS 미적용 상태에서 API를 호출하면 발생해요.
