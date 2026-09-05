# 获取知识库列表

检索知识库列表，支持分页和过滤选项。

<div class="method-badge get">GET</div> `/datasets`

## 授权

<div class="param-row">
  <span class="param-name">Authorization</span>
  <span class="param-type">string</span>
  <span class="param-location">header</span>
  <span class="param-required">必填</span>
</div>

API Key 鉴权，月异 API 请求都应在 `Authorization` HTTP Header 中包含有效的 API Key，格式为 `Bearer {API_KEY}`。强烈建议开发者把 API Key 放在后端存储，而非分享或者放在客户端存储，以免 API-Key 泄露，导致财产损失。

## 查询参数

<div class="param-row">
  <span class="param-name">keyword</span>
  <span class="param-type">string</span>
</div>

搜索关键词，如果包含关键词则过滤。

<div class="param-row">
  <span class="param-name">tag_ids</span>
  <span class="param-type">string[]</span>
</div>

通过标签过滤 ID 列表，数组参数只允许有一个值的列表。

<div class="param-row">
  <span class="param-name">page</span>
  <span class="param-type">integer</span>
  <span class="param-default">默认值: 1</span>
</div>

分页页码。

<div class="param-row">
  <span class="param-name">limit</span>
  <span class="param-type">integer</span>
  <span class="param-default">默认值: 20</span>
</div>

每页返回的条数。

取值范围 1 - 100

<div class="param-row">
  <span class="param-name">include_all</span>
  <span class="param-type">boolean</span>
  <span class="param-default">默认值: false</span>
</div>

是否返回全部数据集，该模式仅对内部调用有效。

## 响应

```bash
curl --request GET \
     --url 'https://api.dify.ai/v1/datasets?page=1&limit=20' \
     --header 'Authorization: Bearer <token>'
```

```json
{
  "data": [
    {
      "id": "309b53cc-b144-4c59-8388-8cd2373e002c",
      "name": "string",
      "description": "string",
      "provider": "external",
      "permission": "string",
      "data_source_type": "string",
      "indexing_technique": "string",
      "app_count": 123,
      "document_count": 123,
      "word_count": 123,
      "created_by": "3ef0b3cc-b644-4b50-9889-8dc25736052a",
      "created_at": 123,
      "updated_by": "3ef0b3cc-b644-4b50-9889-8dc25736052a",
      "updated_at": 123,
      "embedding_model": "string",
      "embedding_model_provider": "string",
      "embedding_available": true
    }
  ],
  "has_more": true,
  "limit": 123,
  "total": 123,
  "page": 123
}
```
