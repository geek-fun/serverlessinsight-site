# ServerlessInsight 命令行

一下将列举ServerlessInsight所支持的所有命令以及具体使用方法。ServerlessInsight可以通过`si -h` 查看对应命令的帮助文档。

## validate 校验配置文件

`validate`命令用于校验`serverlessinsight.yml`配置文件是否合法，校验通过将输出成功信息，否则返回错误信息。

```bash
si validate
```

![validate校验成功示例](/cli-validate-success.png)

## deploy 部署Serverless应用

`deploy`命令用于部署Serverless应用到指定的Serverless供应商中。

```bash
si deploy --stage dev <stackName>
```

其中\<stackName\>是必选项，用以指定资源栈的名称,deploy命令还支持如下参数：

- **--stage/-s**: 指定部署的环境，默认值为`default`。
- **--parameter/-p**: 传递变量值并覆盖默认值。
- **--file/-f**: 指定部署的配置文件，默认值为`serverlessinsight.yml`。

## destroy 销毁Serverless应用

`destroy`命令用于销毁Serverless应用。

```bash
si destroy --stage dev <stackName>
```

- **--stage/-s**: 指定部署的环境，默认值为`default`。
