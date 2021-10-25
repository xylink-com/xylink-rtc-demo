import React from 'react';
import { Button, Row, Col, Form, Input, Switch } from 'antd';
import './index.scss';

interface IProps {
  onHandleSubmit: () => string;
  user: {
    phone: string,
    password: string,
    meeting: string,
    meetingPassword: string,
    meetingName: string,
    muteVideo: boolean,
    muteAudio: boolean
  },
  onChangeInput: () => any;
  isThird: boolean;
}

const Login: React.FC<any> = (props: any) => {
  const { onHandleSubmit, user, onChangeInput, isThird } = props;

  return (
    <Form onFinish={onHandleSubmit} className="login-form" initialValues={user}>
      {
        // 第三方没有账户登录的权限，自动隐藏
        // 第三方入会只需要填写会议号、会议号入会密码、入会昵称即可
        !isThird &&
        <>
          <Form.Item
            name="phone"
            rules={[{ required: true, message: 'Please input your phone!' }]}
          >
            <Input
              type="phone"
              placeholder="手机号"
              onChange={(e) => {
                onChangeInput(e.target.value, 'phone')
              }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input
              type="text"
              placeholder="登录密码"
              onChange={(e) => {
                onChangeInput(e.target.value, 'password')
              }}
            />
          </Form.Item>
        </>
      }
      <Form.Item
        name="meeting"
        rules={[{ required: true, message: 'Please input your meeting id!' }]}
      >
        <Input
          type="text"
          placeholder="会议号"
          onChange={(e) => {
            onChangeInput(e.target.value, 'meeting')
          }}
        />
      </Form.Item>
      <Form.Item
        name="meetingPassword"
      >
        <Input
          type="text"
          placeholder="入会密码"
          onChange={(e) => {
            onChangeInput(e.target.value, 'meetingPassword')
          }}
        />
      </Form.Item>

      <Form.Item
        name="meetingName"
        rules={[{ required: true, message: 'Please input your meeting name!' }]}
      >
        <Input
          type="text"
          placeholder="入会昵称"
          onChange={(e) => {
            onChangeInput(e.target.value, 'meetingName')
          }}
        />
      </Form.Item>

      <Form.Item name="muteVideo" style={{ marginBottom: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          入会时关闭摄像头: <Switch checked={user.muteVideo} onChange={(e) => {
            onChangeInput(e, 'muteVideo')
          }} />
        </div>
      </Form.Item>

      <Form.Item name="muteAudio">
        <div style={{ textAlign: 'left' }}>
          入会时静音: <Switch checked={user.muteAudio} onChange={(e) => {
            onChangeInput(e, 'muteAudio')
          }} />
        </div>
      </Form.Item>

      <Row justify="center">
        <Col span={24}><Button size="large" type="primary" htmlType="submit">加入会议</Button></Col>
      </Row>
    </Form>
  )
}

export default Login;
