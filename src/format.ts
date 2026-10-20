import { format } from 'sql-formatter';

export const formatOracleSql = (sql: string): string => {
  return format(sql, {
    tabWidth: 2,
    useTabs: false,
    language: 'plsql',
    keywordCase: 'preserve',
    dataTypeCase: 'preserve',
    functionCase: 'preserve',
    identifierCase: 'preserve',
    indentStyle: 'standard',
    logicalOperatorNewline: 'before',
    expressionWidth: 80,
    linesBetweenQueries: 1,
    denseOperators: false,
    newlineBeforeSemicolon: false,
  }).trim();
};
