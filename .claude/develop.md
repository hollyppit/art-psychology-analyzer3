---
url: 'https://developers-apps-in-toss.toss.im/login/develop.md'
description: '토스 로그인 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.'
---

# 개발하기

![](/assets/login_flow.Dq_ZsON9.png)

::: tip BaseURL
`https://apps-in-toss-api.toss.im`
:::

## 1. 인가 코드 받기

**SDK를 통해 연동해주세요.**

사용자의 인증을 요청하고, 사용자가 인증에 성공하면 인가 코드를 메소드 응답으로 전달드려요.\
`appLogin` 함수를 사용해서 인가 코드(`authorizationCode`)와 `referrer`를 받을 수 있어요.\
[appLogin](../bedrock/reference/framework/로그인/appLogin.md)를 확인해 주세요.

* 샌드박스앱에서는 `referrer` 가 `sandbox`가 반환돼요
* 토스앱에서는 `referrer` 가 `DEFAULT` 가 반환돼요

::: tip 참고하세요

인가코드의 유효시간은 10분입니다.

:::

### **토스 로그인을 처음 진행할 때**

`appLogin` 함수를 호출하면 토스 로그인 창이 열리고, 앱인토스 콘솔에서 등록한 약관 동의 화면이 노출돼요.\
사용자가 필수 약관에 동의하면 인가 코드가 반환돼요.

### **토스 로그인을 이미 진행했을 때**

`appLogin` 함수를 호출하면 별도의 로그인 창 없이 바로 인가 코드가 반환돼요.

## 2. AccessToken 받기

사용자 정보 조회 API 호출을 위한 **접근 토큰을 발급해요.**

* Content-Type: `application/json`
* Method: `POST`
* URL: `/api-partner/v1/apps-in-toss/user/oauth2/generate-token`

::: tip 참고하세요
AccessToken의 유효시간은 1시간이에요.
:::

**요청**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|authorizationCode|string|Y|인가코드|
|referrer|string|Y|referrer|

**성공 응답**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|tokenType|string|Y|bearer 로 고정|
|accessToken|string|Y|accessToken|
|refreshToken|string|Y|refreshToken|
|expiresIn|string|Y|만료시간(초)|
|scope|string|Y|인가된 scope(구분)|

```json
{
  "resultType": "SUCCESS",
  "success": {
    "accessToken": "eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtMHVmMmhaUmpJTnNEQTdLNHVuVHhMb3IwcWNSa2JNPSIsImF1ZCI6IjNlenQ2ZTF0aDg2b2RheTlwOWN1eTg0dTRvdm5nNnNzIiwibmJmIjoxNzE4MjU0ODM2LCJzY29wZSI6WyJ1c2VyX2NpIiwidXNlcl9iaXJ0aGRheSIsInVzZXJfbmF0aW9uYWxpdHkiLCJ1c2VyX25hbWUiLCJ1c2VyX3Bob25lIiwidXNlcl9nZW5kZXIiXSwiaXNzIjoiaHR0cHM6Ly9jZXJ0LnRvc3MuaW0iLCJleHAiOjE3MTgyNTg0MzYsImlhdCI6MTcxODI1NDgzNiwianRpIjoiMTJkYjYwZjYtMjEzYS00NWQ3LTllOTItODBjMzBdseY2JkMGQ3In0.W1cjoeMN8pd3Jqgh6h8YzSVQ1PUNldulJJgy6bgH1AoDbv5xFTlBLzz9Slb_u52zUpyZbhglwblQmNJs7GT6-us7XtfxSGxTUY3ORqIhF_PPGQ6soi_Qgsi-hmX165CCAilf8cltSTTuTt8xOiEbLuSTY-cecxo7SkPUonQ_0v4_Ik0kwOiOBuYZyuch3KmlYQZTqsJmxlwJAPB8M9tZTtDpLOv9MEPU35YS7CZyN0l7lwn1EKrDHJdzA5CnstqEdz2I0eREmMgZoG9mSEybgD4NtPmVJos6AJerUGgSmzP_TwwlybVATuGpnAUmH1idaZJ-MHZJhUhR82z4zTn3bw",
    "refreshToken": "xNEYPASwWw0n1AxZUHU9KeGj8BitDyYo4wi8rpfkUcJwByVxpAdUzwtIaWGVL6vHdrXLCxIlHAQRPF9hHnFleTsHkqUXzc-_78sD_r1Uh5Ff9UCYfArx8LTn1Vk99dDb",
    "scope": "user_ci user_birthday user_nationality user_name user_phone user_gender",
    "tokenType": "Bearer",
    "expiresIn": 3599
  }
}
```

**실패 응답**\
인가 코드가 만료되었거나 동일한 인가 코드로 AccessToken 을 중복으로 요청할 경우

```json
{
  "error": "invalid_grant"
}
```

```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "INTERNAL_ERROR",
    "reason": "요청을 처리하는 도중에 문제가 발생했습니다."
  }
}
```

## 3. AccessToken 재발급 받기

사용자 정보 조회 API를 호출하기 위한 접근 토큰을 재발급해요.

* Content-type : application/json
* Method : `POST`
* URL : `/api-partner/v1/apps-in-toss/user/oauth2/refresh-token`

::: tip 참고하세요

refreshToken 유효시간은 14일이에요.

:::

**요청**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|refreshToken|string|Y|발급받은 RefreshToken|

**성공 응답**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|tokenType|string|Y|bearer 로 고정|
|accessToken|string|Y|accessToken|
|refreshToken|string|Y|refreshToken|
|expiresIn|string|Y|만료시간(초)|
|scope|string|Y|인가된 scope(구분)|

**실패 응답**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|errorCode|string|Y|에러 코드|
|reason|string|Y|에러 메시지|

## 4. 사용자 정보 받기

사용자 정보를 조회해요.\
`DI`는 `null`로 내려오며, 횟수 제한 없이 호출할 수 있어요.\
개인정보 보호를 위해 모든 개인정보는 **암호화된 형태**로 제공돼요.

* Content-type : application/json
* Method : `GET`
* URL : `/api-partner/v1/apps-in-toss/user/oauth2/login-me`

::: tip `scope` 에 `user_key` 값이 추가될 예정이에요
`scope` 파라미터는 **콘솔에서 선택한 항목 중 사용자가 동의한 값만** 내려와요.\
**2026년 1월 2일부터 `scope` 값에 `user_key` 항목이 추가돼요.**\
신규 scope 추가로 인해 **기존에 정의되지 않은 값이 포함될 수 있으니,** scope 처리 시 예외가 발생하지 않도록 주의해주세요.
:::

**요청 헤더**
| 이름 | 타입 | 필수값 여부 | 설명 |
|---------------|---------|--------------|----------------------------------------------------------------------|
| Authorization | string | Y | AccessToken으로 인증 요청  `Authorization: Bearer ${AccessToken}` |

**성공 응답**
| 이름 | 타입 | 필수값 여부 | 암호화 여부 | 설명 |
|--------------|--------|--------------|--------------|--------------------------------------------------------------|
| userKey | number | Y | N | 사용자를 식별하기 위한 고유 값이에요. |
| scope | string | Y | N | 인가된 scope 목록이에요. 콘솔에서 선택한 항목 중 사용자가 동의한 값과 `user_key` 항목이 포함돼요. |
| agreedTerms | list | Y | N | 사용자가 동의한 약관 목록이에요. |
| name | string | N | Y | 사용자 이름이에요. |
| phone | string | N | Y | 사용자 휴대전화번호예요. |
| birthday | string | N | Y | 사용자 생년월일이에요.(yyyyMMdd) |
| ci | string | N | Y | 사용자 CI값이에요. |
| di | string | N | Y | 항상 `null` 값으로 내려와요. |
| gender | string | N | Y | 사용자 성별 정보예요.(MALE/FEMALE) |
| nationality | string | N | Y | 사용자 내/외국인 여부예요.(LOCAL/FOREIGNER) |
| email | string | N | Y | 사용자 이메일 정보예요. 점유 인증은 하지 않은 값이에요. |

```json
{
  "resultType": "SUCCESS",
  "success": {
    "userKey": 443731104,
    "scope": "user_ci,user_birthday,user_nationality,user_name,user_phone,user_gender, user_key",
    "agreedTerms": ["terms_tag1", "terms_tag2"],
    "name": "ENCRYPTED_VALUE",
    "phone": "ENCRYPTED_VALUE",
    "birthday": "ENCRYPTED_VALUE",
    "ci": "ENCRYPTED_VALUE",
    "di": null,
    "gender": "ENCRYPTED_VALUE",
    "nationality": "ENCRYPTED_VALUE",
    "email": null
  }
}
```

**실패 응답**\
유효하지 않은 토큰을 사용할 경우, 현재 사용 중인 access\_token의 유효시간을 확인하고 재발급을 진행해주세요.

```json
{
  "error": "invalid_grant"
}
```

**서버 에러 응답 예시**\
| errorCode | 설명 |
|----------------|---------------------------|
| INTERNAL\_ERROR | 내부 서버 에러 |
| USER\_KEY\_NOT\_FOUND | 로그인 서비스에 접속한 유저 키 값을 찾을 수 없음 |
| USER\_NOT\_FOUND | 토스 유저 정보를 찾을 수 없음 |
| BAD\_REQUEST\_RETRIEVE\_CERT\_RESULT\_EXCEEDED\_LIMIT | 조회 가능 횟수 초과  동일한 토큰으로 `/api/login/user/me/without-di` API 조회하면 정상적으로 조회되나, di 필드는 null 값으로 내려감 |

```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "INTERNAL_ERROR",
    "reason": "요청을 처리하는 도중에 문제가 발생했습니다."
  }
}
```

## 5. 사용자 정보 복호화하기

콘솔을 통해 이메일로 받은 `복호화 키`와 `AAD(Additional Authenticated DATA)` 로 진행해주세요.

**암호화 알고리즘**

* AES 대칭키 암호화
* 키 길이 : 256비트
* 모드 : GCM
* AAD : 복호화 키와 함께 이메일로 전달드려요.

**데이터 교환방식**

* 암호화된 데이터의 앞 부분에는 IV(NONCE)가 포함돼 있어요.
* 복호화 시 암호문에서 IV를 추출해 사용해야 정상적으로 복호화돼요.

**복호화 샘플 코드**

::: details Kotlin 예제

```kotlin
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class Test {
    fun decrypt(
        encryptedText: String,
        base64EncodedAesKey: String,
        add: String,
    ): String {
        val IV_LENGTH = 12
        val decoded = Base64.getDecoder().decode(encryptedText)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keyByteArray = Base64.getDecoder().decode(base64EncodedAesKey)
        val key = SecretKeySpec(keyByteArray, "AES")
        val iv = decoded.copyOfRange(0, IV_LENGTH)
        val nonceSpec = GCMParameterSpec(16 * Byte.SIZE_BITS, iv)

        cipher.init(Cipher.DECRYPT_MODE, key, nonceSpec)
        cipher.updateAAD(add.toByteArray())

        return String(cipher.doFinal(decoded, IV_LENGTH, decoded.size - IV_LENGTH))
    }
}
```

:::

::: details PHP 예제

```php
<?php

class Test {
    public function decrypt($encryptedText, $base64EncodedAesKey, $add) {
        $IV_LENGTH = 12;
        $decoded = base64_decode($encryptedText);
        $keyByteArray = base64_decode($base64EncodedAesKey);
        $iv = substr($decoded, 0, $IV_LENGTH);
        $ciphertext = substr($decoded, $IV_LENGTH);

        $tag = substr($ciphertext, -16);
        $ciphertext = substr($ciphertext, 0, -16);

        $decrypted = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $keyByteArray,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            $add
        );

        return $decrypted;
    }
}


// 사용 예제
$test = new Test();
$encryptedText = "Encrypted Text"; // Encrypted Text 입력
$base64EncodedAesKey = "Key"; // Key 입력
$add = "TOSS";

$result = $test->decrypt($encryptedText, $base64EncodedAesKey, $add);
echo $result;

?>
```

:::

::: details JAVA 예제

```java
public class Test {
    public String decrypt(
        String encryptedText,
        String base64EncodedAesKey,
        String add
    ) throws Exception {
        final int IV_LENGTH = 12;
        byte[] decoded = Base64.getDecoder().decode(encryptedText);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] keyByteArray = Base64.getDecoder().decode(base64EncodedAesKey);
        SecretKeySpec key = new SecretKeySpec(keyByteArray, "AES");
        byte[] iv = new byte[IV_LENGTH];
        System.arraycopy(decoded, 0, iv, 0, IV_LENGTH);
        GCMParameterSpec nonceSpec = new GCMParameterSpec(16 * Byte.SIZE, iv);

        cipher.init(Cipher.DECRYPT_MODE, key, nonceSpec);
        cipher.updateAAD(add.getBytes());

        byte[] decrypted = cipher.doFinal(decoded, IV_LENGTH, decoded.length - IV_LENGTH);
        return new String(decrypted);
    }
}
```

:::

## 6. 로그인 끊기

발급받은 AccessToken을 더 이상 사용하지 않거나 사용자의 요청으로 토큰을 만료시켜야 할 경우 토큰을 삭제(만료)해주세요.

* Content-type : application/json
* Method : `POST`
* URL :
  * accessToken 으로 연결 끊기 : `/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token`
  * userKey 로 연결 끊기 : `/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key`

**AccessToken 으로 로그인 연결 끊기**

```
// 포맷
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $access_token'

// 예시
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJraWQiOiJjZXJ0IizzYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtMHVmMmhaUmpJTnNEQTdLNHVuVHhMb3IwcWNSa2JNPSIsImF1ZCI6IjNlenQ2ZTF0aDg2b2RheTlwOWN1eTg0dTRvdm5nNnNzIiwibmJmIjoxNzE4MjU0ODM2LCJzY29wZSI6WyJ1c2VyX2NpIiwidXNlcl9iaXJ0aGRheSIsInVzZXJfbmF0aW9uYWxpdHkiLCJ1c2VyX25hbWUiLCJ1c2VyX3Bob25lIiwidXNlcl9nZW5kZXIiXSwiaXNzIjoiaHR0cHM6Ly9jZXJ0LnRvc3MuaW0iLCJleHAiOjE3MTgyNTg0MzYsImlhdCI6MTcxODI1NDgzNiwianRpIjoiMTJkYjYwZjYtMjEzYS00NWQ3LTllOTItODBjMzBmY2JkMGQ3In0.W1cjoeMN8pd3Jqgh6h8YzSVQ1PUNldulJJgy6bgH1AoDbv5xFTlBLwk9Slb_u52zUpyZbhglwblQmNJs7GT6-us7XtfxSGxTUY3ORqIhF_PPGQ6soi_Qgsi-hmX165CCAilf8cltSTTuTt8xOiEbLuSTY-cecxo7SkPUonQ_0v4_Ik0kwOiOBuYZyuch3KmlYQZTqsJmxlwJAPB8M9tZTtDpLOv9MEPU35YS7CZyN0l7lwn1EKrDHJdzA5CnstqEdz2I0eREmMgZoG9mSEybgD4NtPmVJos6AJerUGgSmzP_TwwlybVATuGpnAUmH1idaZJ-MHZJhUhR82z4zTn3bw'
```

**userKey 로 로그인 연결 끊기**

::: tip 참고하세요

하나의 userKey에 연결된 AccessToken이 많을 경우 **readTimeout(3초)** 이 발생할 수 있어요.\
이 경우 요청을 재시도하지 말고, 일정 시간 후 다시 시도해 주세요.

:::

```
// 포맷
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $access_token' \
--data '{"userKey": $user_key}'

// 예시
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key' \
--header 'Content-Type: application/json' \
--data '{"userKey": 443731103}'
```

```json
{
  "resultType": "SUCCESS",
  "success": {
    "userKey": 443731103
  }
}
```

## 7. 콜백을 통해 로그인 끊기

사용자가 토스앱 내에서 서비스와의 연결을 해제한 경우 가맹점 서버로 알려드려요.\
서비스에서 연결이 끊긴 사용자에 대한 처리가 필요한 경우 활용할 수 있어요.
콜백을 받을 URL과 basic Auth 헤더는 콘솔에서 입력할 수 있어요.

::: tip 꼭 확인해 주세요
서비스에서 직접 로그인 연결 끊기 API를 호출한 경우에는 **콜백이 호출되지 않아요.**
:::

**GET 방식**

* 요청 requestParam에 `userKey`와 `referrer`을 포함합니다.

```
// 포맷
curl --request GET '$callback_url?userKey=$userKey&referrer=$referrer'

// 예시
curl --request GET '$callback_url?userKey=443731103&referrer=UNLINK'
```

**POST 방식**

* 요청 body에 `userKey`와 `referrer`을 포함합니다.

```
// 포맷
curl --request POST '$callback_url' \
--header 'Content-Type: application/json' \
--data '{"userKey": $user_key, "referrer": $referrer}'

// 예시
curl --request POST '$callback_url' \
--header 'Content-Type: application/json' \
--data '{"userKey": 443731103, "referrer": "UNLINK"}'
```

referrer 은 연결 끊기 요청 경로에요.\
| referrer | 설명 |
|----------|------|
| `UNLINK` | 사용자가 토스앱에서 직접 연결을 끊었을 때 호출돼요.&#x20;
(경로: 토스앱 → 설정 → 인증 및 보안 → 토스로 로그인한 서비스 → ‘연결 끊기’) |
| `WITHDRAWAL_TERMS` | 사용자가 로그인 서비스 약관 동의를 철회할 때 호출돼요.&#x20;
(경로: 토스앱 → 설정 → 법적 정보 및 기타 → 약관 및 개인정보 처리 동의 → 서비스별 동의 내용 : "토스 로그인" → ‘동의 철회하기’) |
| `WITHDRAWAL_TOSS` | 사용자가 토스 회원을 탈퇴할 때 호출돼요. |

## 트러블슈팅

### 로컬 개발 중 인증 에러가 발생할 때

로컬에서 개발할 때 인증 에러가 발생하는 원인은 주로 두가지예요.

1. 인증 토큰이 만료됨\
   기존에 발급받은 인증 토큰이 만료되었을 수 있어요. 새로운 토큰을 발급받아 다시 시도해보세요.

2. 개발자 로그인이 되지 않음
   샌드박스 환경에서 개발자 계정으로 로그인하지 않은 상태일 수 있어요. [샌드박스 앱 다운로드](/development/test/sandbox)를 참고해 로그인을 진행한 뒤 다시 시도해보세요.
