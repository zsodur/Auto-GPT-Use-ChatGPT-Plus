# Chatgpt API By Browser Script

这个项目通过油猴脚本（Tampermonkey）在用户浏览器上运行，并将网页版的ChatGPT操作转换为一个API接口。你可以使用这个API来做一些有趣的事情，比如玩[Auto-GPT](https://github.com/Significant-Gravitas/Auto-GPT)。

## 更新

2024-05-19: 支持新版本UI和gpt-4 api。

## 特点

- API 无成本。
- 如果你拥有chatgpt plus帐户，则可以无成本使用gpt-4 api。
- 具有无限的上下文。
- 不容易被禁止，更容易处理错误。

## 使用

### 第一步 安装和配置

1. 确保你的系统已安装了Node.js和npm。
2. 克隆此仓库并在项目目录下运行 `npm install` 安装依赖。
3. 运行 `npm run start` 以启动Node.js服务器。
4. 或者可以使用 Docker `docker-compose up` 来启动Node.js服务器

### 第二步 使用Tampermonkey

1. 安装[Tampermonkey](https://www.tampermonkey.net/)浏览器扩展。
2. 打开Tampermonkey管理面板并创建一个新的脚本。
3. 复制`tampermonkey-script.js`文件的内容到新建的脚本中并保存。

### 第三步 下载并安装浏览器扩展程序 Disable Content-Security-Policy

从[这里](https://chromewebstore.google.com/detail/disable-content-security/ieelmcmcagommplceebfedjlakkhpden)下载

### 第四步 打开并登录ChatGPT

[https://chat.openai.com/](https://chat.openai.com/)

### 第五步 使用API

发送一个POST到API地址 http://localhost:8766/v1/chat/completions

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Who are you?"
    }
  ],
  "model": "gpt-4"
}

```
#### API 参数

| 参数        | 描述                                            | 默认值  | 是否必选 |
|-------------|---------------------------------------------------|--------|----------|
| messages    | 参考 openai api                       |      | 是       |
| model       | 不再支持，请在网页上选择模型                |      |        |
| stream      | 参考 openai api                        | false  | 否       |


### 玩 Auto-GPT 例子

修改Auto-GPT中llm_utils.py文件

```python
# response = openai.ChatCompletion.create(
#     model=model,
#     messages=messages,
#     temperature=temperature,
#     max_tokens=max_tokens,
# )
response = requests.post("http://localhost:8766/v1/chat/completions", json={"messages": messages, "model": model, "newChat": False, "temperature": temperature, "max_tokens": max_tokens}).json()

# return response.choices[0].message["content"]
return response["choices"][0]["message"]["content"]
```
