// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
// import { Configuration, OpenAIApi } from "openai";

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "helloworld-sample" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('extension.codename', async () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World!');
    // 获取当前打开的文件的editor
    const editor = vscode.window.activeTextEditor;
    console.log(editor);
    if (!editor) {
      vscode.window.showInformationMessage('请打开文件！');
      return;
    }
    const selection = editor.selection;
    // console.log('是否点击:', selection.active.line, selection.active.character);
    // if (!selection.active.character) {
    //   vscode.window.showInformationMessage('没有输入焦点！');
    //   return;
    // }
    const what = await vscode.window.showInputBox({ placeHolder: '描述...' });

    const gptKey = vscode.workspace.getConfiguration().get('codename.gptkey') as string;
    console.log('gptKey===', gptKey);

    if (what && gptKey) {
      const res = await getCodeName(gptKey, what) as any;
      console.log('what====', what, res);
      // const chatCompletion = await openai.createChatCompletion({
      //   model: "gpt-3.5-turbo",
      //   messages: [{role: "user", content: "Hello world"}],
      // });
      // console.log(chatCompletion.data.choices[0].message);
      if (res === -1 || res.length === 0) {
        vscode.window.showInformationMessage(`错误请求！请查看key是否有效！${gptKey}`);
        return;
      }
      vscode.window.showQuickPick(
        [
          ...res,
        ],
        {
          placeHolder: '选择变量名'
        })
        .then(function (msg) {
          console.log('msg===', msg);
          if (!msg) return;
          const commentPos = new vscode.Position(selection.start.line, 0);
          const position = new vscode.Position(selection.start.line, selection.start.character);
          editor.edit((editBuilder) => {
            editBuilder.insert(commentPos, `// ${what} \n`);
            editBuilder.insert(position, msg);
          });
        });
    }
  });

  context.subscriptions.push(disposable);
}


function getCodeName(key: string, desc: string) {
  const data = JSON.stringify({
    "model": "gpt-3.5-turbo",
    "messages": [ {
      "role": "user", 
      "content": `您好，
      我希望你扮演丰富经验的程序设计专家，根据程序设计的中命名规则：匈牙利命名法、驼峰式命名法、帕斯卡命名法和下划线命名法，帮我设计变量名、函数名。
      我将在要生成命名的描述内容之前添加/，你根据不用的情况生成相对应合理的命名。例如：”我输入/用户信息, 你会生成: userInfo、user_info、objMyData、UserInfo“。
      要求：1.命名必须是英文;2.至少生成6个命名; 3.不要过多解释，只回复英文命名;4.命名必须按照标准程序设计的中命名规则;5.回复格式以‘,’隔开。
      第一个命令是：/${desc}` }] // messages就是你发的消息是数组形式
  });
  const config = {
    method: 'post',
    url: 'https://api.openai-proxy.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    data: data
  };
  return new Promise(resolve => {
    axios(config)
    .then(function (response) {
      console.log('response===', JSON.stringify(response.data));
      const content = getMutliLevelProperty(response.data, 'choices.0.message.content', '');
      console.log('content====', content);
      if (content ) {
        resolve(content.split(', ').filter((a: any) => a));
      } else {
        resolve(-1);
      }
    })
    .catch(function (error) {
      console.log('gpt error', error);
      resolve(-1);
    });
  });
}


function getMutliLevelProperty(ctx: any, path: any, defaultVal: any) {
  let res = defaultVal;
  if (typeof path !== 'string' || Object.keys(ctx).length === 0) return res;
  let key = path.replace(/\[(\w+)\]/g, '.$1');
  key = key.replace(/^\./, '');
  const arr = key.split('.');
  for (let i = 0, count = arr.length; i < count; i++) {
    const p = arr[i];
    if ((Object.keys(ctx).length || Array.isArray(ctx)) && p in ctx) {
      ctx = ctx[p];
    } else {
      return res;
    }
  }
  res = ctx;
  return res;
}