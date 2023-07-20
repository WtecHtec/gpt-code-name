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

    const gptKey = vscode.workspace.getConfiguration().get('codename.gptkey');
    console.log('gptKey===', gptKey);

    if (what && gptKey) {
      const res = await getCodeName(gptKey, what);
      console.log('what====', what, res);
      // const chatCompletion = await openai.createChatCompletion({
      //   model: "gpt-3.5-turbo",
      //   messages: [{role: "user", content: "Hello world"}],
      // });
      // console.log(chatCompletion.data.choices[0].message);
      vscode.window.showQuickPick(
        [
          what
        ],
        {
          placeHolder: '选择命名'
        })
        .then(function (msg) {
          console.log('msg===', msg);
          if (!msg) return;
          const commentPos = new vscode.Position(selection.start.line, 0);
          const position = new vscode.Position(selection.start.line, selection.start.character);
          editor.edit((editBuilder) => {
            editBuilder.insert(commentPos, `// ${msg} \n`);
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
    "messages": [ {"role": "user", "content": `${desc}`} ] // messages就是你发的消息是数组形式
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
      resolve(response.data);
    })
    .catch(function (error) {
      console.log('gpt error', error);
      resolve(-1);
    });
  });
}