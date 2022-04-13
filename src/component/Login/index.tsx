/**
 * 加入会议
 */
import React from 'react';
import { Button, Row, Col, Form, Input, Checkbox } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import xyRTC from '@xylink/xy-rtc-sdk';
import { IUser } from '@/type';
import './index.scss';
import logo from '@/assets/img/login-logo.png'

interface IProps {
  user: IUser,
  onHandleSubmit: () => Promise<void>;
  onChangeInput: (value: string | boolean, key: string) => void;
  onToggleSetting: () => void;
}

const Login = (props: IProps) => {
  const { user, onChangeInput, onHandleSubmit, onToggleSetting } = props;

  return <div className='login'>
    <div className='login-header'>
      <Row justify="center">
        <Col lg={{ span: 22 }} xl={{ span: 16 }} xs={{ span: 24 }}>
          <a href="https://www.xylink.com/" target="_blank" rel="noopener noreferrer">
            <img className='login-header-logo' src={logo} alt="logo" />
          </a>
        </Col>
      </Row>
    </div>

    <div className='login-container'>
      <div>
        <div className='login-title'>加入会议</div>

        <Row justify="center">
          <Form onFinish={onHandleSubmit} className="login-form" initialValues={user}>
            {
              // 第三方没有账户登录的权限，自动隐藏
              // 第三方入会只需要填写会议号、会议号入会密码、入会昵称即可
              user.isThird ?
                <>
                  <Form.Item
                    name="extUserId"
                  >
                    <Input
                      type="extUserId"
                      placeholder="extUserId"
                      onChange={(e) => {
                        onChangeInput(e.target.value, 'extUserId')
                      }}
                    />
                  </Form.Item>
                </> :
                <>
                  <Form.Item
                    name="phone"
                    rules={[{ required: true, message: '请输入用户账号' }]}
                  >
                    <Input
                      type="phone"
                      placeholder="输入小鱼账号"
                      onChange={(e) => {
                        onChangeInput(e.target.value, 'phone')
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入账号密码' }]}
                  >
                    <Input
                      type="text"
                      placeholder="输入密码"
                      autoComplete='off'
                      onChange={(e) => {
                        onChangeInput(e.target.value, 'password')
                      }}
                    />
                  </Form.Item>
                </>
            }
            <Form.Item
              name="meeting"
              rules={[{ required: true, message: '请输入云会议室号或终端号' }]}
            >
              <Input
                type="text"
                placeholder="输入云会议室号或终端号"
                autoComplete='off'
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
                autoComplete='off'
                onChange={(e) => {
                  onChangeInput(e.target.value, 'meetingPassword')
                }}
              />
            </Form.Item>

            <Form.Item
              name="meetingName"
              rules={[{ required: true, message: '请输入会议中显示的名称' }]}
            >
              <Input
                type="text"
                placeholder="输入会议中显示的名称"
                autoComplete='off'
                onChange={(e) => {
                  onChangeInput(e.target.value, 'meetingName')
                }}
              />
            </Form.Item>

            <Button size="large" type="primary" htmlType="submit" className='join-btn'>加入会议</Button>

            <Form.Item name="muteVideo" style={{ marginBottom: '15px' }}>
              <Checkbox
                checked={user.muteVideo}
                onChange={(e) => {
                  onChangeInput(e.target.checked, 'muteVideo')
                }}
              >
                入会时关闭摄像头
              </Checkbox>
            </Form.Item>

            <Form.Item name="muteAudio">
              <Checkbox
                checked={user.muteAudio}
                onChange={(e) => {
                  onChangeInput(e.target.checked, 'muteAudio')
                }}
              >
                入会时静音
              </Checkbox>
            </Form.Item>

          </Form>
        </Row>

        <div className="setting-btn">
          <span onClick={onToggleSetting}>
            设置
            <SettingOutlined style={{ marginLeft: '2px' }} />
          </span>
        </div>
      </div>
    </div>

    <div className='footer'>
      <a className='link' rel="noopener noreferrer"
        target="_blank"
        href="http://openapi.xylink.com/doc_web/product/description">小鱼易连WebRTC SDK开发文档
      </a>
      <div className="version">版本：{xyRTC.version}</div>
    </div>

  </div>
}

export default Login;
