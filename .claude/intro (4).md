---
url: 'https://developers-apps-in-toss.toss.im/firebase/intro.md'
---
# Firebase 연동하기

앱인토스(미니앱) Webview 환경에서 Firebase를 연동하는 방법을 안내해요.\
이 문서는 **Vite(React + TypeScript)** 기반 프로젝트를 기준으로 작성되었어요.

***

## 개요

Firebase는 인증, 데이터베이스, 파일 저장 등 다양한 기능을 제공하는 서비스예요.\
앱인토스 WebView 환경에서도 동일하게 사용할 수 있지만, **보안 설정과 환경 변수 관리**가 중요해요.

***

## 1. 준비하기

* Firebase 콘솔 계정 ([console.firebase.google.com](https://console.firebase.google.com))
* Vite(React + TypeScript)로 만든 프로젝트
* Node.js, npm (또는 yarn, pnpm)

## 2. Firebase 프로젝트 만들기

1. Firebase 콘솔에서 **프로젝트 생성**을 눌러 새 프로젝트를 만들어요.
2. 프로젝트 설정 → **앱 추가** → **웹(\</>)** 을 선택해요.
3. 앱 닉네임을 입력하고 등록하면, 아래처럼 구성 정보(firebaseConfig)가 표시돼요.

```js
const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  databaseURL: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
  measurementId: '...'
}
```

## 3. 환경 변수 설정하기

Firebase 구성 정보는 보안을 위해 Vite 환경 변수로 관리하는 걸 권장해요.

프로젝트 루트에 `.env` 파일을 만들고 아래처럼 작성하세요.

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

코드에서는 `import.meta.env.VITE_FIREBASE_API_KEY`처럼 불러와요.

## 4. Firebase 설치 및 초기화

최신 Firebase 모듈식 SDK(v12+) 기준으로 작성했어요.

```bash
npm install firebase
# 또는
yarn add firebase
```

`src/firebase/init.ts`

```ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

> **참고:**
>
> * `databaseURL`은 **Realtime Database**를 사용할 때만 필요해요.
>   Firestore를 사용한다면 생략해도 괜찮아요.
> * `measurementId`는 **Firebase Analytics**(Google Analytics)를 쓸 때 필요해요.

## 5. Firestore 사용 예제

Firestore를 초기화했다면, React 컴포넌트 안에서 데이터를 읽거나 쓸 수 있어요.\
아래는 `App.tsx`에서 단일 문서를 읽고 저장하는 가장 간단한 예시예요.

```tsx
import { useState, useEffect } from 'react'
import { db } from './firebase/init'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function App() {
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')

  // Firestore에서 데이터 읽기
  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'users', 'exampleUser')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setSavedName(snap.data().name)
      }
    }
    fetchData()
  }, [])

  // Firestore에 데이터 쓰기
  const handleSave = async () => {
    const ref = doc(db, 'users', 'exampleUser')
    await setDoc(ref, { name })
    setSavedName(name)
    setName('')
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Firestore 간단 예제</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력"
      />
      <button onClick={handleSave}>저장</button>
      <p>저장된 이름: {savedName || '(없음)'}</p>
    </div>
  )
}

export default App

```

### 동작 방식

* 데이터 읽기 (`getDoc`)
  * Firestore의 users/exampleUser 문서를 한 번만 불러와요.
  * 문서가 존재하면 snap.data()의 값을 화면에 표시해요.

* 데이터 쓰기 (`setDoc`)
  * 입력한 이름을 Firestore에 덮어써 저장해요.
  * 문서가 없으면 자동으로 새로 생성돼요.

![firestore](/assets/firestore-1.DBSmKjYU.png)

> Firestore는 단일 문서 외에도 여러 기능을 지원해요.
>
> * 실시간 구독 : `onSnapshot(doc(...))`을 사용하면 문서가 변경될 때마다 UI가 자동으로 갱신돼요.
> * 컬렉션 다루기 : `collection()`, `addDoc()`을 사용하면 여러 문서를 추가하고 불러올 수 있어요.
> * 파일 저장 : `getStorage()`로 `Storage`를 연결해 이미지나 파일을 업로드할 수 있어요.
> * 인증 연동 : `getAuth()`와 함께 사용하면 사용자별 데이터 저장이 가능해요.

## 6. 보안 체크리스트

* 민감한 정보 환경 변수로 관리하기
  * Firebase API Key, 서비스 계정 키 등은 코드에 직접 작성하지 않고 `.env`로 관리하세요.
* 환경 파일을 Git 등에 업로드하지 않기
  * `.env` 파일은 `.gitignore`에 반드시 추가하세요.
  * 키가 노출되면 Firebase 콘솔에서 즉시 재발급하고, 관련 프로젝트 권한을 점검하세요.
* Firebase 보안 규칙 설정하기
  * Firestore / Storage는 기본적으로 모든 사용자에게 공개되어 있어요.
  * 배포 전에 반드시 인증된 사용자만 접근하도록 규칙을 수정하세요.
* 출처(Origin) 제한 확인하기
  * Firebase 콘솔의 Authentication / Hosting / API Key 설정에서 허용 도메인을 제한해두세요.
  * 미니앱(WebView) 도메인만 허용하면 무단 접근을 예방할 수 있어요.

:::tip 허용 대상 도메인
https://.apps.tossmini.com : 실제 서비스 환경
https://.private-apps.tossmini.com : 콘솔 QR 테스트 환경
:::
