import AdminLayout from '../../components/admin/AdminLayout';

export const metadata = {
  title: 'Zodia | Panel de Administración',
  description: 'Control cósmico y moderación de Zodia',
};

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
