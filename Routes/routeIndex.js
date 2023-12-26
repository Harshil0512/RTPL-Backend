const router = require('express').Router();
const employeeRoute = require('../Routes/employeeRoute');
const visitorRoute = require("../Routes/visitorRoute");
const meetingTypeRouter = require('../Routes/meetingType');
const meetingModeRouter = require('../Routes/meetingMode');
const comapanyRouter = require('../Routes/companyRoute');
const officeRouter = require('../Routes/officeRoute')
const departmentRouter = require('../Routes/departmentRoute');
const designationRouter = require('../Routes/designationRoute');
const employeeRoleRouter = require('../Routes/employeeRoleRoute');

router.use('/employee',employeeRoute);
router.use('/visitor', visitorRoute);
router.use('/meetingtype', meetingTypeRouter);
router.use('/meetingmode', meetingModeRouter);
router.use('/company',comapanyRouter);
router.use('/company/office',officeRouter);
router.use('/department', departmentRouter);
router.use('/designation', designationRouter);
router.use('/role', employeeRoleRouter);

module.exports = router