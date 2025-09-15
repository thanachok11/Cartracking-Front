import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserInfo, changePassword, updateProfileWithImage, updateUser } from '../../api/components/usersApi';
import '../../styles/pages/UserInfo.css';
import { UserRole } from '../../types/User';

interface UserProfile {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
  profile_img?: string;
}
interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserInfo() {
  const navigate = useNavigate();
  
  // User profile state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profile_img: ''
  });
  
  // Password form
  const [passwordForm, setPasswordForm] = useState<PasswordChange>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Auto clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = await getCurrentUserInfo();
      console.log('👤 Current user info:', userInfo);
      
      if (userInfo?.user) {
        console.log('👤 User data loaded:', userInfo.user);
        setUser(userInfo.user);
        setProfileForm({
          firstName: userInfo.user.firstName || '',
          lastName: userInfo.user.lastName || '',
          email: userInfo.user.email || '',
          profile_img: userInfo.user.profileImage || ''
        });
      }
    } catch (err: any) {
      console.error('❌ Error loading user data:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = user?._id || user?.id;
    if (!userId) {
      setError('ไม่พบข้อมูลผู้ใช้');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let result;

      if (imageFile) {
        // อัปเดตพร้อมรูปภาพ
        result = await updateProfileWithImage(profileForm, imageFile);
      } else {
        // อัปเดตเฉพาะข้อมูล
        result = await updateUser(userId, profileForm);
      }

      // ✅ แทนที่ token เดิมด้วย token ใหม่
      if (result?.token) {
        localStorage.setItem('token', result.token);
        console.log('🔄 Token updated:', result.token);
      }

      setSuccess('อัพเดตข้อมูลส่วนตัวสำเร็จ');
      setShowProfileEdit(false);
      setImageFile(null);
      setImagePreview(null);

      // ✅ โหลดข้อมูล user ใหม่จาก backend หรือ token ใหม่
      await loadUserData();
    } catch (err: any) {
      console.error('❌ Profile update error:', err);
      setError(err.message || 'ไม่สามารถอัพเดตข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // ใช้ API ที่เพิ่มใหม่
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

      setSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
      setShowPasswordChange(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('❌ Password change error:', err);
      setError(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // const getRoleDisplayName = (role: string) => {
  //   switch (role) {
  //     case 'super admin': return 'Super Admin';
  //     case 'admin': return 'Admin';
  //     case 'manager': return 'Manager';
  //     case 'user': return 'User';
  //     case 'viewer': return 'Viewer';
  //     default: return role;
  //   }
  // };
  const getRoleDisplayName = (role: UserRole): string => {
      switch (role) {
          case UserRole.LEVEL_5: return 'Super Admin';
          case UserRole.LEVEL_4: return 'Admin';
          case UserRole.LEVEL_3: return 'Manager';
          case UserRole.LEVEL_2: return 'User';
          default: return 'User';
      }
};
  if (loading) {
    return (
      <div className="userinfo-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="userinfo-page">
        <div className="error-container">
          <p>ไม่พบข้อมูลผู้ใช้</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="userinfo-page">
      <div className="userinfo-container">
        <div className="userinfo-header">
          <h2>ข้อมูลส่วนตัว</h2>
          <button 
            onClick={() => navigate(-1)} 
            className="back-button"
          >
            ← ย้อนกลับ
          </button>
        </div>

        {/* Alert messages */}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess(null)} className="alert-close">×</button>
          </div>
        )}

        {/* User Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {(user.profile_img || profileForm.profile_img) ? (
              <img 
                src={user.profile_img || profileForm.profile_img} 
                alt={`${user.firstName} ${user.lastName}`}
                className="avatar-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg';
                }}
              />
            ) : (
              <img
                src="https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg"
                alt="Default Avatar"
                className="avatar-image"
              />
            )}
          </div>
          <div className="profile-details"></div>
            <div className="profile-info">
              <h3>{user.firstName} {user.lastName}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-role">{getRoleDisplayName(user.role ?? UserRole.LEVEL_2)}</p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={() => setShowProfileEdit(true)}
            disabled={user?.role === UserRole.LEVEL_5} // type-safe
            className={`btn-edit ${user?.role === UserRole.LEVEL_5 ? "btn-disabled" : ""}`}
          >
            แก้ไขข้อมูลส่วนตัว
          </button>

          <button
            onClick={() => setShowPasswordChange(true)}
            disabled={user?.role === UserRole.LEVEL_5} // ป้องกัน super admin
            className={`btn-secondary ${user?.role === UserRole.LEVEL_5 ? "btn-disabled" : ""}`}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>แก้ไขข้อมูลส่วนตัว</h3>
                <button 
                  onClick={() => setShowProfileEdit(false)}
                  className="modal-close"
                >
                  ×
                </button>
              </div>
              
              <form 
                className="profile-form"
                onSubmit={(e) => {
                  console.log('📝 Form onSubmit triggered');
                  handleProfileUpdate(e);
                }}
              >
                <div className="form-row">
                  <div className="form-group">
                    <label>ชื่อ</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>นามสกุล</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>อีเมล</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label>รูปโปรไฟล์</label>
                  <div className="image-upload-container">
                    {imagePreview ? (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button 
                          type="button" 
                          onClick={removeImage}
                          className="remove-image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (user.profile_img || profileForm.profile_img) ? (
                      <div className="current-image">
                        <img src={user.profile_img || profileForm.profile_img} alt="Current" />
                        <p>รูปปัจจุบัน</p>
                      </div>
                    ) : null}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    <p className="file-hint">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saving}
                    onClick={() => console.log('🔘 Submit button clicked')}
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowProfileEdit(false)}
                    className="btn-secondary"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>เปลี่ยนรหัสผ่าน</h3>
                <button 
                  onClick={() => setShowPasswordChange(false)}
                  className="modal-close"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>รหัสผ่านปัจจุบัน</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <small>รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</small>
                </div>
                
                <div className="form-group">
                  <label>ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordChange(false)}
                    className="btn-secondary"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}