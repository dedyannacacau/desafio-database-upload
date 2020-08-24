import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('you do not have enough balance.');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError(
        'You cannot create a transactions without having enough balance.',
      );
    }

    const category_id = await this.checkCategory(category);

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }

  private async checkCategory(category_name: string): Promise<string> {
    const categoriesRepository = getRepository(Category);

    const checkCategory = await categoriesRepository.findOne({
      where: { title: category_name },
    });

    if (!checkCategory) {
      const category = categoriesRepository.create({
        title: category_name,
      });

      await categoriesRepository.save(category);
      return category.id;
    }

    return checkCategory.id;
  }
}

export default CreateTransactionService;
