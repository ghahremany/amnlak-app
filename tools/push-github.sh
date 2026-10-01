#!/usr/bin/env bash
# ---------------------------------------------------------------
#  ساخت مخزن در گیت‌هاب و ارسال پروژه
#  استفاده:
#     GH_USER=username GH_TOKEN=your_token REPO=amnlak-app PRIVATE=true \
#       bash tools/push-github.sh
# توکن را فقط به‌صورت متغیر محیطی استفاده کنید و هرگز داخل فایل یا چت قرار ندهید.
# ---------------------------------------------------------------
set -e
: "${GH_USER:?نام کاربری گیت‌هاب را در GH_USER بگذارید}"
: "${GH_TOKEN:?توکن گیت‌هاب را در GH_TOKEN بگذارید}"
REPO=${REPO:-amnlak-app}
PRIVATE=${PRIVATE:-true}
PROJ=$(cd "$(dirname "$0")/.." && pwd)
cd "$PROJ"

echo "▸ بررسی/ساخت مخزن $GH_USER/$REPO …"
code=$(curl -s -o /tmp/gh.json -w "%{http_code}" -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/repos/$GH_USER/$REPO)
if [ "$code" != "200" ]; then
  curl -s -o /tmp/gh.json -w "%{http_code}\n" -X POST \
    -H "Authorization: token $GH_TOKEN" -H "Accept: application/vnd.github+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO\",\"private\":$PRIVATE,\"description\":\"اپلیکیشن اندروید امنلاک — محاسبات ساختمان‌سازی و معاملات ملکی\"}" >/dev/null
  echo "  مخزن ساخته شد."
else
  echo "  مخزن از قبل وجود دارد."
fi

git -C "$PROJ" rev-parse --git-dir >/dev/null 2>&1 || git init -q
git config user.name  "${GIT_NAME:-Mohammad Javad Ghahremani}"
git config user.email "${GIT_EMAIL:-mj.ghahremani.dev@gmail.com}"
git add -A
git diff --cached --quiet || git commit -q -m "${MSG:-به‌روزرسانی پروژه}"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$REPO.git"
git push -u origin main

# پاک کردن توکن از تنظیمات محلی
git remote set-url origin "https://github.com/$GH_USER/$REPO.git"
echo "✅ منتشر شد: https://github.com/$GH_USER/$REPO"
