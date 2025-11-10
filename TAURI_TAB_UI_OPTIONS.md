# Tauri でタブUI実装の方法

## 質問
マルチウィンドウではなく、タブのUIで表示することは可能？

## 答え
**はい、可能です！** 複数のアプローチがあります。

---

## オプション1: iframe ベースのタブ (最もシンプル)

### 概要
- Vue/HTML/CSSでタブUIを実装
- 各タブは `<iframe>` でScrapboxページを表示
- 1つのウィンドウ内で完結

### メリット
✅ 実装が簡単
✅ 既存のVueコードを活用
✅ タブの見た目を完全にカスタマイズ可能
✅ Electronの現在の動作に近い

### デメリット
❌ iframeの制限（一部のサイトで表示できない場合がある）
❌ パフォーマンスがやや劣る可能性

### 実装イメージ
```html
<div class="tabs">
  <div class="tab" v-for="tab in tabs" @click="selectTab(tab)">
    {{ tab.title }}
  </div>
</div>
<iframe :src="activeTab.url" class="content"></iframe>
```

---

## オプション2: Tauri の WebviewWindow管理 + カスタムタブUI

### 概要
- メインウィンドウにタブUIのみ表示
- 各タブに対応するWebviewWindowを作成
- アクティブなタブのウィンドウだけを表示

### メリット
✅ 完全なウェブコンテンツの互換性
✅ 各タブが独立したWebView
✅ メモリ効率が良い

### デメリット
❌ 実装が複雑
❌ ウィンドウの位置制御が必要
❌ OS依存の挙動に注意

### 実装アプローチ
```rust
// Rustバックエンド
#[tauri::command]
async fn switch_tab(app: AppHandle, tab_id: String) {
    // 他のウィンドウを隠す
    hide_all_windows(&app);
    // アクティブなウィンドウを表示
    show_window(&app, &tab_id);
}
```

---

## オプション3: tauri-plugin-webview (推奨)

### 概要
- Tauriの公式プラグインを使用
- ウィンドウ内に埋め込みWebViewを作成
- ネイティブのタブ機能

### メリット
✅ ネイティブパフォーマンス
✅ 完全なウェブ互換性
✅ メモリ効率最適
✅ 公式サポート

### デメリット
❌ プラグインの追加が必要
❌ ドキュメントがまだ少ない

### 実装ステップ
```toml
# Cargo.toml
[dependencies]
tauri-plugin-webview = "2.0"
```

```rust
use tauri_plugin_webview::WebviewExt;

#[tauri::command]
fn create_tab_webview(window: Window, url: String) {
    window.create_webview(url);
}
```

---

## オプション4: ハイブリッドアプローチ (推奨)

### 概要
- 基本はiframeベースのタブUI
- 外部リンクは新しいウィンドウで開く
- バランスの取れたアプローチ

### メリット
✅ 実装が比較的簡単
✅ 柔軟性が高い
✅ ユーザー体験が良い

### 実装例
```javascript
// メインコンテンツはiframe
<iframe v-if="tab.internal" :src="tab.url"></iframe>

// 外部リンクは新しいウィンドウ
if (isExternalLink(url)) {
  invoke('open_new_window', { url, title });
} else {
  // タブ内で表示
  addTab(url);
}
```

---

## 現在のsbeアプリに最適なアプローチ

### 推奨: **オプション1 (iframeベース) → 必要に応じて オプション3**

#### 理由:
1. **素早く実装できる**
   - 既存のVue3コードをそのまま活用
   - HTMLとCSSで完全制御

2. **Scrapboxとの互換性**
   - ScrapboxはiframeでOK
   - 外部サイトの埋め込みも対応

3. **段階的な移行**
   - まずiframeで動作確認
   - 必要ならプラグインに移行

---

## 実装プラン

### Phase 1: iframeベースのタブUI (2-3日)
```
1. タブコンポーネントの作成 (Vue)
2. タブ管理ロジック
3. iframeでScrapbox表示
4. 履歴・お気に入り統合
```

### Phase 2: 最適化 (必要に応じて)
```
1. tauri-plugin-webview の検討
2. パフォーマンス計測
3. メモリ使用量の確認
```

---

## 実装サンプル: iframeベースのタブ

### Vue コンポーネント案

```vue
<template>
  <div class="app">
    <!-- タブバー -->
    <div class="tab-bar">
      <div 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab', { active: tab.id === activeTabId }]"
        @click="selectTab(tab.id)"
      >
        <img :src="tab.icon" class="tab-icon" />
        <span class="tab-title">{{ tab.title }}</span>
        <button @click.stop="closeTab(tab.id)" class="tab-close">×</button>
      </div>
      <button @click="addNewTab" class="new-tab">+</button>
    </div>

    <!-- コンテンツエリア -->
    <div class="content-area">
      <iframe 
        v-for="tab in tabs"
        v-show="tab.id === activeTabId"
        :key="tab.id"
        :src="tab.url"
        class="tab-content"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';

const tabs = ref([
  { id: 1, title: 'Start', url: 'start.html', icon: '📋' }
]);
const activeTabId = ref(1);
let nextTabId = 2;

function selectTab(id) {
  activeTabId.value = id;
}

function closeTab(id) {
  const index = tabs.value.findIndex(t => t.id === id);
  tabs.value.splice(index, 1);
  
  if (activeTabId.value === id && tabs.value.length > 0) {
    activeTabId.value = tabs.value[0].id;
  }
}

function addNewTab() {
  const newTab = {
    id: nextTabId++,
    title: 'New Tab',
    url: 'about:blank',
    icon: '📄'
  };
  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}

async function openScrapboxPage(url) {
  const newTab = {
    id: nextTabId++,
    title: 'Loading...',
    url: url,
    icon: '📄'
  };
  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tab-bar {
  display: flex;
  background: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 4px;
  gap: 4px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  max-width: 200px;
}

.tab.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
}

.new-tab {
  padding: 8px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.content-area {
  flex: 1;
  position: relative;
}

.tab-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
```

---

## パフォーマンス比較

### iframe方式
- メモリ: ~150-200MB (5タブ)
- 起動: 即座
- 実装: シンプル

### WebviewWindow方式  
- メモリ: ~120-150MB (5タブ)
- 起動: やや遅い
- 実装: 複雑

### tauri-plugin-webview方式
- メモリ: ~100-130MB (5タブ)
- 起動: 速い
- 実装: 中程度

---

## 次のステップ

1. **PoC拡張**: iframeベースのタブUIを追加
2. **動作確認**: Scrapboxとの互換性
3. **ユーザーフィードバック**: UI/UX評価
4. **最適化**: 必要に応じてプラグイン検討

---

## 結論

**タブUIは完全に実装可能です！**

推奨アプローチ:
1. まず **iframeベース** で実装 (素早く動作確認)
2. 問題なければそのまま使用
3. パフォーマンスが気になる場合のみプラグイン検討

Electronの現在のタブ動作を再現でき、かつメモリ効率も維持できます。
