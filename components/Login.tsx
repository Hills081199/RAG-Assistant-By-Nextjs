'use client'

import { useRouter } from 'next/navigation'
import { Button, Card, Form, Input, Typography, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async (values: any) => {
    try {
      // Xử lý đăng nhập, gọi API
      // Nếu thành công -> lưu cookie token -> redirect
      document.cookie = `token=dummy-token; path=/`
      message.success('Đăng nhập thành công!')
      router.push('/reading')
    } catch (error) {
      message.error('Đăng nhập thất bại!')
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card
        title="Đăng nhập"
        style={{ width: 400, borderRadius: 8 }}
        headStyle={{ textAlign: 'center', fontSize: 20 }}
      >
        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Tài khoản"
            rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập tài khoản"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Typography.Paragraph style={{ textAlign: 'center' }}>
          Chưa có tài khoản? <a href="/register">Đăng ký</a>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}