# ServerlessInsight 命令行

一下将列举ServerlessInsight所支持的所有命令以及具体使用方法。ServerlessInsight可以通过`si -h` 查看对应命令的帮助文档。

## validate 校验配置文件

`validate`命令用于校验`serverlessinsight.yml`配置文件是否合法，校验通过将输出成功信息，否则返回错误信息。

```bash
si validate
```

![validate校验成功示例](/cli-validate-success.png)

## deploy 部署 Serverless 应用

`deploy`命令用于部署Serverless应用到指定的Serverless供应商中。

```bash
si deploy --stage dev <stackName>
```

其中\<stackName\>是必选项，用以指定资源栈的名称,deploy命令还支持如下参数：

- **--stage/-s**: 指定部署的环境，默认值为`default`。
- **--parameter/-p**: 传递变量值并覆盖默认值。
- **--file/-f**: 指定部署的配置文件，默认值为`serverlessinsight.yml`。
- **--region/-r**: 指定部署的区域，默认值为`cn-hangzhou`。
- **--provider/-pr**: 指定部署的云厂商，默认值为`aliyun`。
- **--accessKeyId/-ak**: 指定部署的云厂商的AccessKeyId。
- **--accessKeySecret/-as**: 指定部署的云厂商的AccessKeySecret。
- **--securityToken/-at**: 指定部署的云厂商的SecurityToken。

## destroy 销毁Serverless应用

`destroy`命令用于销毁Serverless应用。

```bash
si destroy --stage dev <stackName>
```

- **--stage/-s**: 指定部署的环境，默认值为`default`。

## run-local 本地运行 Serverless 应用

`run-local` 命令用于在本地运行 Serverless 应用，方便开发人员进行调试。

```bash
si local --stage dev <stackName>
```
- **--stage/-s**: 指定运行的环境，默认值为`default`。
- **--debug/-d**: 启用调试模式，默认值为`false`。
- **--watch/-w**: 启用文件监视模式，默认值为`true`。
