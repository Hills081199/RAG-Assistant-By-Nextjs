import { IsInt, IsIn, IsString } from 'class-validator';

export class ExtractVocabularyDto {
  @IsInt()
  @IsIn([1, 2, 3])
  level: number = 1;

  @IsString()
  text: string = "";
}
