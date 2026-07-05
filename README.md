# 모바일 청첩장 (Mobile Wedding Invitation)

GitHub Pages + Jekyll로 배포하는 모바일 청첩장입니다.
클래식 아이보리 톤, 백엔드 없이 정적 페이지로만 동작합니다.

## 구성

| 섹션 | 내용 |
|------|------|
| 표지 | 메인 사진 자리 + 신랑·신부 이름 + 예식 일시 |
| 인사말 | 인사 문구 + 혼주 소개 |
| 연락처 | 신랑·신부·혼주 전화/문자 바로가기 |
| 예식 안내 | 달력(예식일 표시) + 실시간 D-day 카운트다운 |
| 갤러리 | 사진 6장 자리 표시 |
| 오시는 길 | 약도 자리 + 네이버/카카오맵 링크 + 대중교통 안내 |
| 마음 전하실 곳 | 신랑측/신부측 계좌번호 아코디언 + 복사 버튼 |
| 방명록 | 축하 메시지 작성/조회 — Firebase Firestore 저장 (미설정 시 데모 모드) |

## 내용 수정하기

**`_config.yml` 파일 하나만 수정하면 됩니다.**
이름, 연락처, 예식 일시, 예식장 정보, 인사말, 계좌번호가 모두 이 파일에 있습니다.

> `_config.yml`을 수정한 뒤에는 로컬 서버(`jekyll serve`)를 재시작해야 반영됩니다.

## 사진 넣기

현재는 사진이 들어갈 자리에 자리 표시(placeholder)만 있습니다.
실제 사진을 넣으려면:

1. `assets/images/` 폴더를 만들고 사진 파일을 넣습니다.
2. `index.html`에서 해당 `photo-placeholder` div를 `<img>` 태그로 교체합니다.

```html
<!-- 교체 전 -->
<div class="photo-placeholder photo-placeholder--main ...>...</div>

<!-- 교체 후 -->
<img class="photo-main" src="{{ '/assets/images/main.jpg' | relative_url }}" alt="웨딩 사진">
```

## 방명록 설정 (Firebase Firestore, 무료)

GitHub Pages는 정적 호스팅이라 서버가 없습니다. 방명록은 브라우저에서
Firebase Firestore(구글 무료 DB)에 직접 저장하는 방식으로 동작합니다.

> 설정하지 않으면 **데모 모드**로 동작합니다 — 메시지가 작성자 기기(localStorage)에만 저장됩니다.

### 설정 순서 (약 5분)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성 (애널리틱스 불필요)
2. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기** → **프로덕션 모드**로 시작 (리전: `asia-northeast3` 서울 추천)
3. Firestore **규칙** 탭에 아래 규칙을 붙여넣고 게시:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestbook/{doc} {
      // 누구나 읽기/작성 가능, 수정·삭제 불가
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['name', 'message', 'createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 20
        && request.resource.data.message is string
        && request.resource.data.message.size() > 0
        && request.resource.data.message.size() <= 500;
      allow update, delete: if false;
    }
  }
}
```

4. **프로젝트 설정(톱니바퀴) → 일반** 에서 두 값을 확인:
   - `프로젝트 ID` → `_config.yml`의 `firebase_project_id`
   - `웹 API 키` → `_config.yml`의 `firebase_api_key`

```yaml
guestbook:
  enabled: true
  firebase_project_id: "my-wedding-12345"
  firebase_api_key: "AIzaSy..."
```

5. 푸시하면 끝. 이제 모든 하객의 메시지가 공유 DB에 저장됩니다.

> 웹 API 키는 공개되어도 되는 값입니다 (Firebase 웹 앱의 기본 구조).
> 실제 보안은 위의 Firestore 규칙이 담당합니다 — 이름/메시지 형식의 문서 생성과 읽기만 허용됩니다.
> 부적절한 메시지는 Firebase 콘솔 → Firestore → `guestbook` 컬렉션에서 직접 삭제할 수 있습니다.

## GitHub Pages 배포

1. GitHub에 새 저장소를 만듭니다. (예: `wedding-invitation`)
2. `_config.yml`의 `baseurl`을 저장소 이름에 맞게 수정합니다.
   - 저장소가 `<username>.github.io` → `baseurl: ""`
   - 그 외 (예: `wedding-invitation`) → `baseurl: "/wedding-invitation"`
3. 코드를 푸시합니다.

```bash
git remote add origin https://github.com/<username>/wedding-invitation.git
git push -u origin main
```

4. 저장소 **Settings → Pages** 에서
   - Source: `Deploy from a branch`
   - Branch: `main` / `/ (root)` 선택 후 Save
5. 1~2분 뒤 `https://<username>.github.io/wedding-invitation/` 에서 확인합니다.

GitHub Pages가 Jekyll을 자동으로 빌드하므로 별도 빌드/배포 설정이 필요 없습니다.

## 로컬 미리보기 (선택)

```bash
gem install bundler
bundle install
bundle exec jekyll serve
# → http://localhost:4000
```

Ruby가 없다면 그냥 GitHub에 푸시해서 확인해도 됩니다.
