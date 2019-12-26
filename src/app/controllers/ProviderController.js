import user from "../models/User";
import file from "../models/File";

class ProviderController {
  async index(req, res) {
    const providers = await user.findAll({
      where: { provider: true },
      attributes: ["id", "nome", "email", "avatar_id"],
      include: [
        {
          model: file,
          as: "avatar",
          attributes: ["url", "id", "path"]
        }
      ]
    });
    return res.json(providers);
  }
}

export default new ProviderController();
