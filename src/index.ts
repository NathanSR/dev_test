import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';

const app = express();
app.use(express.json());

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "test_db",
  entities: [User, Post],
  synchronize: true,
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const initializeDatabase = async () => {
  await wait(20000);
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  } catch (err) {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
  }
};

initializeDatabase();

const UserDB = AppDataSource.getRepository(User)
const PostDB = AppDataSource.getRepository(Post)

app.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    if (!firstName) return res.status(400).json({ message: "Nome não informado!" })
    if (!lastName) return res.status(400).json({ message: "Sobrenome não informado!" })
    if (!email) return res.status(400).json({ message: "Email não informado!" })

    const user = new User()
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;

    await UserDB.save(user)
    res.status(201).json(user)

  } catch (error) {
    res.status(500).json({ message: "Erro ao salvar o usuário!" })
  }
});

// app.get('/users', async (req, res) => {
//   const users = await UserDB.find()
//   res.status(200).json(users)
// })

app.post('/posts', async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    if (!title) return res.status(400).json({ message: "Título não informado!" })
    if (!description) return res.status(400).json({ message: "Descrição não informada!" })
    if (!userId) return res.status(400).json({ message: "Usuário não informado!" })

    const post = new Post()
    post.title = title;
    post.description = description;

    const user = await UserDB.findOneBy({ id: userId })
    if (!user) return res.status(404).json({ message: "Usuário informado não foi encontrado!" });

    post.user = user;

    await PostDB.save(post);
    res.status(201).json(post);

  } catch (error) {
    res.status(500).json({ message: "Erro ao salvar o post" })
  }
});

// app.get('/posts', async (req, res) => {
//   const posts = await PostDB.find({ relations: ['user'] })
//   res.status(200).json(posts)
// })

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
