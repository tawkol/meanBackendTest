const Student = require("../models/StudentsModelDB");

// createStudent
// if id already exist still loading in postman
let addStudent = (req, res) => {
  let std = new Student({
    fn: req.body.fn,
    ln: req.body.ln,
    dept: req.body.dept,
    id: req.body.id,
  });

  std
    .save()
    .then(() => {
      res.status(200).send("data of student added successfully");
    })
    .catch((err) => {
      for (let i in err.errors) {
        console.log(err.errors[i].message);
      }
      res.status(400).send("data of student not added");
    });
};

// getAllStudents
let getAllStudents = async (req, res) => {
  try {
    let std = await Student.find()
      .select({ fn: 1, ln: 1, id: 1 })
      .sort({ id: -1 });
    res.status(200).send(std);
  } catch (err) {
    for (let i in err.errors) {
      console.log(err.errors[i].message);
    }
    res.status(400).send("data of student not added");
  }
};

// getStudentByID
let getStudentByID = async (req, res) => {
  try {
    let std = await Student.findById(req.params.id);
    if (std) {
      res.status(200).send(std);
    } else {
      return res.status(404).send("Student with this id not found");
    }
  } catch (err) {
    for (let i in err.errors) {
      console.log(err.errors[i].message);
    }
    res.status(400).send("data of student not added");
  }
};

// updateStudentByID
// important to pointer to _id field
let updateStudentByID = async (req, res) => {
  try {
    let std = await Student.findOneAndUpdate({ _id: req.params.id }, req.body, {
      returnOriginal: false,
    });
    if (std) {
      res.status(200).send(std);
    } else {
      return res.status(404).send("Student with this id not found");
    }
  } catch (err) {
    for (let i in err.errors) {
      console.log(err.errors[i].message);
    }
    res.status(400).send("data of student not added");
  }
};

// deleteStudentByID
let deleteStudentByID = async (req, res) => {
  try {
    let std = await Student.findOneAndRemove(req.params.id);
    if (std) {
      res.status(200).send("Student with this id deleted successfully");
    } else {
      return res.status(404).send("Student with this id not found");
    }
  } catch (err) {
    for (let i in err.errors) {
      console.log(err.errors[i].message);
    }
    res.status(400).send("data of student not added");
  }
};

module.exports = {
  addStudent,
  getAllStudents,
  getStudentByID,
  updateStudentByID,
  deleteStudentByID,
};

// -------------------------------------------------------------------------

// comments
// function addStudent(fn, ln, dept, id) {
//     let std = new Student({
//       fn: fn,
//       ln: ln,
//       dept: dept,
//       id: id,
//     });

//     std
//       .save()
//       .then(() => {
//         console.log("saved..");
//       })
//       .catch((err) => {
//         for (let i in err.errors) {
//           console.log(err.errors[i].message);
//         }
//       });
//   }

// if id not unique and already existing will not show error
//   addStudent("anas", "saleh", "CS", "60");

//

// working

// Student.find({}).then((data)=>{
//   console.log(data);
// })

// ----------------------------------------

// working

// Student.find({}).where("name").equals("anas").then(console.log);

// ----------------------------------------

// not working

// Student.find({ id: { $gte: 1 } }).limit(2).sort({id:-1}).select({name:1,id:1}).then((data)=>{
//     console.log(data);
// })

// ----------------------------------------

// not working

// async function getStudents() {
//   let data = await Student.find({ id: { $gte: 1 } })
//     .sort({ id: -1 })
//     .select({ name: 1 });
//   console.log(data);
// }
// getStudents();
