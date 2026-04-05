let mongoose = require('mongoose');
let roleModel = require('./schemas/roles');
let userModel = require('./schemas/users');
let bcrypt = require('bcrypt');

async function seed() {
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-C3');
    console.log("Connected to MongoDB.");

    try {
        // 1. Tạo role ADMIN
        let adminRole = await roleModel.findOne({ name: 'ADMIN' });
        if (!adminRole) {
            adminRole = new roleModel({
                name: 'ADMIN',
                description: 'Quyền quản trị viên hệ thống'
            });
            await adminRole.save();
            console.log("Đã tạo Role ADMIN. ID:", adminRole._id.toString());
        } else {
            console.log("Role ADMIN đã tồn tại. ID:", adminRole._id.toString());
        }

        // 2. Tạo role USER mặc định (ID '69b6231b3de61addb401ea26' nếu muốn)
        // Chúng ta sẽ tạo một user role thật
        let userRole = await roleModel.findOne({ name: 'USER' });
        if (!userRole) {
            // Thử bắt ép ID giống trong auth.js nếu cần (không khuyến khích nhưng để khớp code)
            try {
                userRole = new roleModel({
                    _id: new mongoose.Types.ObjectId('69b6231b3de61addb401ea26'),
                    name: 'USER',
                    description: 'Quyền người dùng thông thường'
                });
                await userRole.save();
                console.log("Đã tạo Role USER. ID:", userRole._id.toString());
            } catch (e) {
                userRole = new roleModel({
                    name: 'USER',
                    description: 'Quyền người dùng thông thường'
                });
                await userRole.save();
                console.log("Đã tạo Role USER (ID tự sinh). ID:", userRole._id.toString());
            }
        } else {
            console.log("Role USER đã tồn tại. ID:", userRole._id.toString());
        }

        // 3. Tạo tài khoản Admin
        let adminUser = await userModel.findOne({ username: 'admin' });
        
        let salt = bcrypt.genSaltSync(10);
        let password = bcrypt.hashSync("Admin@123", salt);

        if (!adminUser) {
            // Không dùng middleware .pre('save') băm lần nữa vì ta đang thao tác trực tiếp, 
            // nhưng schemas/users.js định nghĩa .pre('save') mã hóa pass lần nữa
            // Nên ta truyền chữ thẳng để để mongoose schema xử lý
            adminUser = new userModel({
                username: 'admin',
                password: 'Admin@123', // Mongoose .pre('save') bên userSchema sẽ tự hash
                email: 'admin@example.com',
                fullName: 'Super Admin',
                role: adminRole._id,
                status: true
            });
            await adminUser.save();
            console.log("Đã tạo user Admin:");
            console.log(" - Username: admin");
            console.log(" - Password: Admin@123");
        } else {
            // Nếu đã có nhưng không phải admin thì đổi quyền
            adminUser.role = adminRole._id;
            await adminUser.save();
            console.log("User admin đã tồn tại. Đã đảm bảo phân quyền ADMIN.");
        }

    } catch (err) {
        console.error("Lỗi:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Đã ngắt kết nối database.");
    }
}

seed();
