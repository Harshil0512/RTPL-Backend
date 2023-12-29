const validator = require("validator");
const COMMON = require("../../Common/common");
const { createAccessToken } = require("../../Middleware/auth");
const CONSTANT = require("../../constant/constant");
const sendMail = require("../../Middleware/emaiService");
const inputFieldsEmployee = [
  "empProfileImg",
  "empIDCard",
  "empAadharCard",
  "aadharNumber",
  "firstName",
  "lastName",
  "emp_code",
  "birthDate",
  "joiningDate",
  "email",
  "featureString",
  "phone",
  "password",
  "createdBy",
  "roleID",
  "companyID",
  "officeID",
  "departmentID",
  "designationID",
];

// login
module.exports.login = async (req, res) => {
  try {
    const { Employee } = req.app.locals.models;
    if (req.body.emp_code && req.body.password) {
      const employeeDetails = await Employee.findOne({
        where: {
          emp_code: req.body.emp_code,
        },
      });
      if (employeeDetails) {
        // Compare the password
        const passwordMatch = await COMMON.DECRYPT(
          req.body.password,
          employeeDetails.password
        );
        if (!passwordMatch) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = createAccessToken(employeeDetails.dataValues);
        // Send the token in the response header
        res.setHeader("Authorization", `Bearer ${token}`);
        res.status(200).json({ message: "Login successfully" });
      } else {
        console.log("Invalid credentials");
        // Return an error response indicating missing data
        res.status(400).json({ error: "Invalid credentials" });
      }
    } else {
      console.log("Invalid perameter");
      // Return an error response indicating missing data
      res.status(400).json({ error: "Invalid perameter" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
// register
module.exports.Registration = async (req, res) => {
  try {
    const { Employee } = req.app.locals.models;
    if (req.body) {
      // get value of CreatedBy
      // COMMON.setModelCreatedByFieldValue(req);
      // Validate email
      if (!validator.isEmail(req.body.email)) {
        return res.status(400).json({ error: "Invalid email" });
      }
      // Validate phone number
      if (!validator.isMobilePhone(req.body.phone.toString(), "any")) {
        return res.status(400).json({ error: "Invalid phone number" });
      }
      const hashedPassword = await COMMON.ENCRYPT(req.body.password);
      if (!hashedPassword) {
        return res
          .status(500)
          .json({ error: CONSTANT.MESSAGE_CONSTANT.SOMETHING_WENT_WRONG });
      }
      req.body.password = hashedPassword;
      const isExistEmployee = await Employee.findOne({
        where: {
          email: req.body.email,
        },
      });
      if (!isExistEmployee) {
        const employee = await Employee.create(req.body, {
          fields: inputFieldsEmployee,
        });
        if (employee) {
          let sender = "rtpl@rtplgroup.com"
          let subject = "Registeration Successfully Done";
          let message = `UserID:${employee.emp_code}\nUrl:http://www.rptl.com `;

          const result = await sendMail(req.body.email, sender, subject, message);
          if (result.success) {
            res.status(201).json({ message: "Employee registered successfully" });
          } else {
            res.status(400).json({ error: result.message });
          }
        }
      } else {
        res
          .status(400)
          .json({ message: "Employee with this Email Already Exist" });
      }
    } else {
      console.log("Invalid perameter");
      res.status(400).json({ error: "Invalid perameter" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};

// Change Password
module.exports.changePassword = async (req, res) => {
  try {
    const { sequelize, Employee } = req.app.locals.models;
    if (
      req &&
      req.body &&
      req.body.empID &&
      req.body.currentPassword &&
      req.body.newPassword
    ) {
      if (req.body.empID === req.user.empID || req.user.roleID === -1) {
        const employeeDetails = await Employee.findByPk(req.body.empID);
        if (employeeDetails) {
          // Compare the password
          const passwordMatch = await COMMON.DECRYPT(
            req.body.currentPassword,
            employeeDetails.password
          );
          if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid Password" });
          }
          const hashedPassword = await COMMON.ENCRYPT(req.body.newPassword);
          if (!hashedPassword) {
            return res
              .status(500)
              .json({ error: CONSTANT.MESSAGE_CONSTANT.SOMETHING_WENT_WRONG });
          }
          return await Employee.update(
            {
              password: hashedPassword,
            },
            {
              where: {
                empID: req.body.empID,
              },
            }
          )
            .then(() => {
              // Return a success response
              res
                .status(200)
                .json({ message: "Employee password change successfully" });
            })
            .catch((error) => {
              console.error("An error occurred:", error);
              // Return an error response
              res.status(500).json({ error: "Internal server error" });
            });
        } else {
          res
            .status(404)
            .json({ error: CONSTANT.MESSAGE_CONSTANT.SOMETHING_WENT_WRONG });
        }
      }
    } else {
      console.log("Invalid perameter");
      // Return an error response indicating missing data
      res.status(400).json({ error: "Invalid perameter" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    // Return an error response
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const { Employee } = req.app.locals.models;
    if (req.body) {
      const user = Employee.findOne({
        //find user using token here
      });
      if (user) {
        const hashedPassword = await COMMON.ENCRYPT(req.body.newPassword);
        if (!hashedPassword) {
          res.status(500).json({ error: CONSTANT.MESSAGE_CONSTANT.SOMETHING_WENT_WRONG });
        }
        user.password = hashedPassword;
        const updatedPassword = await user.save();
        if (!updatedPassword) {
          res.status(400).json({ message: "Password Can not be Setted, Please Try Again Later.", });
        }

        res.status(200).json({ message: "User Password Changed Successfully.", });
      } else {
        res.status(404).json({ message: "User Not Found." });
      }
    } else {
      console.log("Invalid perameter");
      res.status(400).json({ error: "Invalid perameter" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.sendCode = async (req, res) => {
  try {
    const { Employee, VerifyCode } = req.app.locals.models;
    if (req.body) {
      const user = Employee.findOne({
        //find user using token here
      });

      if (user) {
        const verificationCode = Math.floor(1000 + Math.random() * 9000);

        const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
    </head>

    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="background-color: #2196F3; color: white; text-align: center; padding: 20px;">
            <h2>[Your Company Name]</h2>
        </div>

        <div style="padding: 20px;">
            <p>Hello ${user.firstName},</p>
            <p>Please verify your email address by entering below code.</p>
            <p>Your verification code is: <strong>${verificationCode}</strong></p>
            <p>If you did not initiate this change, please contact our support team immediately.</p>
            <p>Best regards,<br>[Your Company Name]</p>
        </div>
    </body>

    </html>
`;



        let subject = "Verify Your Email"
        const res = await sendMail(req.body.newEmail, "rtpl@rtplgroup.com", subject, htmlContent)
        console.log(res);

        const email = await VerifyCode.create({
          verificationCode,
          expiresIn: new Date().getTime() + 300 * 1000,
          email: req.body.newEmail ? req.body.email : user.email,
        });

        const result = await email.save();

        if (result) {
          res.status(200).json({
            message: "Verification Code Sent Successfully.",
            result: result,
          });
        } else {
          res.status(403).json({
            message:
              "Verification Code Can not be Sent, Please Try Again Later.",
          });
        }
      }
    } else {
      console.log("Invalid perameter");
      res.status(400).json({ error: "Invalid perameter" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.verifyCode = async (req, res) => {
  try {
    const { VerifyCode } = req.app.locals.models;
    if (req.body) {
      const codeExists = await VerifyCode.findByPk(req.body.verificationCodeID);

      if (!codeExists) {
        return res
          .status(404)
          .json({ error: "Code not found for the given ID" });
      }

      if (new Date().getTime() > codeExists.expiresIn) {
        res.status(498).json({
          message: "Verification Code Expired, Please Try Again Later.",
        });
      } else {
        if (codeExists.verificationCode == req.body.coeFromUser) {
          res
            .status(200)
            .json({ message: "Code Verification Done Successfully." });
        } else {
          res.status(401).json({ message: "Please Enter Valid Code." });
        }
      }
    } else {
      console.log("Invalid perameter");
      res.status(400).json({ error: "Invalid perameter" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: error.message });
  }
};