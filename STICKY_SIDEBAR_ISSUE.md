# サイドバーSticky機能が動作しない原因の詳細分析

## 問題の概要
サイドバー（`.post-sidebar`）に`position: sticky`を設定しているが、スクロール時に追従（固定）されない。

## 原因の詳細分析

### 1. 親要素の`overflow: hidden`による制約
**問題箇所**: `web/css/layout.css` の `.section` クラス
```css
.section {
    overflow: hidden;  /* ← これがstickyを妨げる */
    isolation: isolate;
}
```

**影響**: 
- `position: sticky`は、親要素に`overflow: hidden`、`overflow: scroll`、`overflow: auto`が設定されていると機能しない
- 現在は`.post-page`で`overflow: visible !important`で上書きしているが、完全に解決していない可能性がある

### 2. 親要素の`isolation: isolate`による影響
**問題箇所**: `web/css/layout.css` の `.section` クラス
```css
.section {
    isolation: isolate;  /* ← これもstickyに影響する可能性がある */
}
```

**影響**:
- `isolation: isolate`は新しいスタッキングコンテキストを作成し、stickyの動作に影響を与える可能性がある
- 現在は`.post-page`で`isolation: auto !important`で上書きしている

### 3. `.section > *`の`position: relative`による干渉
**問題箇所**: `web/css/layout.css` の `.section > *` セレクター
```css
.section > * {
    position: relative;  /* ← これが子要素のstickyに影響する可能性がある */
    z-index: 1;
}
```

**影響**:
- このセレクターは`.section`の直接の子要素すべてに`position: relative`を適用
- `.post-page__inner`は`.section-inner`の子だが、`.section-inner`は`.section`の子なので、間接的に影響を受ける可能性がある
- 現在は`.post-page .section-inner > *`に`position: static`を設定しているが、`.post-page__inner`自体にも`position: relative`が設定されている

### 4. スタッキングコンテキストの階層構造
**現在のHTML構造**:
```
.section.post-page
  └─ .section-inner
      └─ .post-page__inner (position: relative)
          ├─ .post (記事本文)
          └─ .post-sidebar (position: sticky)
```

**問題点**:
- `.post-page__inner`に`position: relative`が設定されていると、その子要素である`.post-sidebar`のstickyが正しく機能しない可能性がある
- sticky要素は、その親要素が`position: relative`、`position: absolute`、`position: fixed`の場合、その親要素の境界内でのみ動作する

### 5. セレクターの詳細度の問題
**現在のCSS**:
```css
.post-page .section-inner > .post-page__inner {
    position: relative;  /* ← これが問題 */
}
```

**問題点**:
- `.section > *`のセレクター（詳細度: 0,0,2,0）と`.post-page .section-inner > .post-page__inner`（詳細度: 0,0,3,0）の競合
- `position: relative`が設定されていると、stickyが機能しない

## 解決策

### 修正内容
1. `.post-page__inner`の`position`を`static`に変更
2. `.post-sidebar`に`!important`を追加して確実に適用
3. `z-index`を追加して他の要素の上に表示

### 修正後のCSS
```css
.post-page .section-inner > .post-page__inner {
    position: static; /* relativeではなくstatic */
}

.post-page .post-sidebar {
    position: -webkit-sticky !important;
    position: sticky !important;
    z-index: 10;
}
```

## 確認事項
- [ ] `.section`の`overflow: hidden`が`.post-page`で上書きされているか
- [ ] `.section`の`isolation: isolate`が`.post-page`で上書きされているか
- [ ] `.post-page__inner`の`position`が`static`になっているか
- [ ] `.post-sidebar`の`position: sticky`が`!important`で確実に適用されているか
- [ ] ブラウザの開発者ツールで実際のスタイルが適用されているか確認
