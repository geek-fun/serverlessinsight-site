# 用户手册

本文档概述了ServerlessInsight的规范，详细介绍了IaC（基础设施即代码）的YAML定义。

## ServerlessInsight Yaml配置规范

ServerlessInsight的YAML配置文件是一个描述Serverless应用的资源的文件，它包含了Serverless应用的所有资源定义，如函数、API网关、事件等。以下是一个ServerlessInsight的YAML配置文件的示例：

> stack.yml

```yaml
version: 0.1
provider:
  name: aliyun
  region: cn-chengdu

vars:
  region: cn-hangzhou
  account_id: 1234567890

stages:
  dev:
    region: ${vars:region}
    account_id: ${vars:account_id}

service: insight-poc

tags:
  owner: geek-fun

functions:
  insight_poc_fn:
    name: insight-poc-fn
    runtime: nodejs18
    handler: ${vars.handler}
    code: artifacts/artifact.zip
    memory: 512
    timeout: 10
    environment:
      NODE_ENV: production
      TEST_VAR: ${vars.testv}
      TEST_VAR_EXTRA: abcds-${vars.testv}-andyou

events:
  gateway_event:
    type: API_GATEWAY
    name: insight-poc-gateway
    triggers:
      - method: GET
        path: /api/hello
        backend: insight-poc-fn

```

如上，一个典型的ServerlessInsight定义包含了`version`、`provider`、`vars`、`stages`、`service`、`tags`、`functions`和`events`
字段。我们来逐个解释一下这个YAML文件的各个部分：

## version

`version`字段指定了ServerlessInsight的YAML配置文件的版本，目前只支持`0.1`版本。
注意主版本之间可能会有不兼容的变化，所以请确保您的配置文件与ServerlessInsight的版本兼容。

```yaml
version: 0.1
```

## provider


`provider`字段指定了ServerlessInsight的提供商信息。
```yaml
provider:
  name: aliyun
  region: cn-chengdu
```
`provider`支持的字段有:
- **name**: 云提供商的名称，包括`aliyun`、`huawei`、`tencent`等，目前只支持`aliyun`，其他提供商的支持正在开发中
  > 支持的云提供商的名称: aliyun, huawei, tencent  
  > required: true
- **region**: 云提供商服务部署目标地域
  > 支持的运行时: 请参考云厂商所支持的地域  
  > required: true

## vars

`vars`字段是一个对象，用于定义一些变量，这些变量可以在其他地方引用。在部署时，可以通过`--parameter key=var`或`-p key=var`
传递变量值并覆盖默认值。
变量可以通过`${vars.var_name}`的方式在模版中进行引用。

```yaml
vars:
  bucket_name: my-bucket
  domain_name: my-domain
```

## stages

`stages`字段是一个对象，用于定义不同stage下的的配置项的值。最佳实践是将部署环境相关的配置项放在`stages`
字段下，使得不同环境下相同的配置项可以被赋予不同的值，如:

```yaml
stages:
  default:
    domain_name: my-domain-dev.com
    database_name: my-database-dev
  local:
    domain_name: localhost
    database_name: localhost
  dev:
    domain_name: my-domain-dev.com
    database_name: my-database-dev
  prod:
    domain_name: my-domain-prod.com
    database_name: my-database-prod
```

在stages中的变量可以通过`${stages.domain_name}`的方式在模版中进行引用,无需指定stage, 在部署/启动服务时，通过`--stage`或
`-s`参数指定部署的环境，如`si deploy --stage prod`，模版便会引用对于stage的变量值。如果不指定stage，默认使用`default`。

## service

`service`字段指定了Serverless应用的名称。`service`
字段是一个全局唯一的标识符，用于区分不同的Serverless应用。不同于命令行中传递的 \<stackName\>
参数，service的值将作为隐形创建资源的ID以及资源名称前缀，且service需要区分部署的stage，所以最佳实践是将service命名为
`<service>-<stage>`。

```yaml
service: insight-poc-${stage}
```

> 注意，${stage}是ServerlessInsight提供的全局预定义变量，表示当前部署的stage，值为命令行中指定的stage或默认值`default`。

## tags

`tags`字段是一个对象，用于定义一些标签。在这个例子中，我们定义了`owner`标签。

## functions

`functions`字段是一个对象，用于定义serverless函数。functions下的每一个子项都是一个方法的定义。function支持的字段有：

- **name**: serverless函数的名称
  > 支持的字符集为`a-zA-Z0-9-_`,长度为1-64个字符
  > required: true
- **runtime**: serverless函数的运行时
  > 支持的运行时:
  nodejs20,nodejs18,nodejs16,nodejs14,nodejs12,nodejs10,nodejs8,python3.10,python3.9,python3,PHP7.2,Java11,.NETCore3.1,Go1.x
- **handler**: serverless函数的处理程序
  > required: true
- **code**: serverless函数的代码包相对项根目录的路径
  > 当前仅支持zip格式的代码包
  > required: true
- **timeout**: serverless函数的超时时间
  > 默认值: 15分钟
- **memory**: serverless函数的内存大小
  > 默认值: 128MB
- **environment**: serverless函数的环境变量
  > 支持的字符集为`a-zA-Z0-9-_`,长度为1-64个字符
  > required: false
- **log**: serverless函数是否开启日志
  > required: false  
  > default: false  
  > 注意: 由于阿里sls创建延迟问题，无法在创建时开启日志，需要stack第一次创建时关闭，等待1～2分钟后开启日志并重新部署。
  

## events

`events`字段是一个对象，用于定义事件。事件是发起函数调用的触发器。可以是一个来自用户的通过api gateway转发的http请求
也可以是来自消息队列，数据库状态改变的事件等，events下的每一个子项都是一个事件的定义。event支持的字段有：

- **type**: 事件的类型（目前仅支持 API_GATEWAY）
  > 支持的事件类型有：API_GATEWAY,SQS,S3,HTTP,Timer等
  > required: true
- **name**: 事件的名称
  > required: true
- **triggers**: 事件的触发器
  > required: true
    - **method**: 事件的方法
      > required: true
      >   支持的方法有：GET,POST,PUT,DELETE,PATCH,HEAD,OPTIONS 以及ANY
    - **path**: 事件的路径
      > required: true
    - **backend**: 事件的后端，通过方法的名称，指定后端的方法，请求最终有指定的方法进行处理
      > required: true
- **custom_domain**: 事件的自定义域名
  > required: false
    - **domain_name**: 自定义域名
      > required: true
    - **certificate_name**: 证书名称
      > required: true
    - **certificate_private_key**: 证书私钥
      > required: true
    - **certificate_body**: 证书内容
      > required: true
      

## databases
`databases`字段是一个对象，用于定义数据库。`databases`下的每一个子项都是一个数据库资源的定义。

```yaml
version: 0.0.1

provider:
  name: aliyun
  region: cn-chengdu

service: insight-es-poc

tags:
  owner: geek-fun

databases:
  insight_es_db:
    name: insight-poc-es
    type: ELASTICSEARCH_SERVERLESS
    version: ES_SEARCH_7.10
    cu:
      min: 1
      max: 6
    storage:
      min: 20
    security:
      basic_auth:
        master_user: 'test-username'
        password: 'U34I6InQ8elseTgqTWT2t2oFXpoqFg'

```

database支持的字段有:

- **name**: 数据库的名称
  > 类型: `string`  
  > required: true

- **type**: 数据库的类型
  > 类型: `string`  
  > 支持的类型: `ELASTICSEARCH_SERVERLESS`, `RDS_MYSQL_SERVERLESS`, `RDS_PGSQL_SERVERLESS`, `RDS_MSSQL_SERVERLESS`  
  > required: true  

- **version**: 数据库的版本
  > 类型: `string`  
  > 支持的版本: `MYSQL_5.7`, `MYSQL_8.0`, `MYSQL_HA_5.7`, `MYSQL_HA_8.0`, `PGSQL_14`, `PGSQL_15`, `PGSQL_16`, `PGSQL_HA_14`, `PGSQL_HA_15`, `PGSQL_HA_16`, `MSSQL_HA_2016`, `MSSQL_HA_2017`, `MSSQL_HA_2019`, `ES_SEARCH_7.10`, `ES_TIME_SERIES_7.10`  
  > required: true

- **cu**: 计算单元配置
  > 类型: `object`
  - **min**: 最小计算单元
    >   类型: `integer`  
    >   最小值: 0  
    >   最大值: 32  
  - **max**: 最大计算单元
    >   类型: `integer`  
    >   最小值: 1  
    >   最大值: 32  

- **storage**: 存储配置
  > 类型: `object`
  - **min**: 最小存储空间
    >   类型: `integer`  
    >   最小值: 20  
    >   required: true

- **security**: 安全配置
  > 类型: `object`
  >   required: true
  - **basic_auth**: 基本认证
      - **master_user**: 主用户
        >   类型: `string`
        >   required: true
      - **password**: 密码
        >   类型: `string`
        >   required: true

- **network**: 网络配置
  > 类型: `object`
    - **type**: 网络类型
      > 类型: `string`  
      > 支持的类型: `PUBLIC`, `PRIVATE`
    - **ingress_rules**: 入站规则
      > 类型: `array`  
      > 项目类型: `string`
    - **public**: 是否公开
      > 类型: `boolean`

每个数据库定义必须包含`name`、`type`、`version`和`security`字段。
