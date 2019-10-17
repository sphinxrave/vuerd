import StoreManagement from '@/store/StoreManagement'
import { Table, Column } from '@/store/table'
import { Relationship } from '@/store/relationship'
import { getData, autoName, uuid } from '@/ts/util'
import {
  formatNames,
  formatSize,
  formatSpace,
  primaryKey,
  primaryKeyColumns,
  MaxLength,
  Name,
  KeyColumn
} from '../SQLHelper'

class PostgreSQL {
  private fkNames: Name[] = []

  public toDDL (store: StoreManagement): string {
    this.fkNames = []
    const stringBuffer: string[] = []
    const tables = store.tableStore.state.tables
    const relationships = store.relationshipStore.state.relationships
    const canvas = store.canvasStore.state

    stringBuffer.push(`DROP SCHEMA IF EXISTS "${canvas.databaseName}" RESTRICT;`)
    stringBuffer.push('')
    stringBuffer.push(`CREATE SCHEMA "${canvas.databaseName}";`)
    stringBuffer.push('')

    tables.forEach((table) => {
      this.formatTable(
        canvas.databaseName,
        table,
        stringBuffer
      )
      stringBuffer.push('')
      this.formatComment(
        canvas.databaseName,
        table,
        stringBuffer
      )
    })
    relationships.forEach((relationship) => {
      this.formatRelation(
        canvas.databaseName,
        tables,
        relationship,
        stringBuffer
      )
      stringBuffer.push('')
    })

    return stringBuffer.join('\n')
  }

  private formatTable (name: string, table: Table, buffer: string[]) {
    buffer.push(`CREATE TABLE "${name}"."${table.name}"`)
    buffer.push(`(`)
    const pk = primaryKey(table.columns)
    const spaceSize = formatSize(table.columns)

    table.columns.forEach((column, i) => {
      if (pk) {
        this.formatColumn(
          column,
          true,
          spaceSize,
          buffer
        )
      } else {
        this.formatColumn(
          column,
          table.columns.length !== i + 1,
          spaceSize,
          buffer
        )
      }
    })
    // PK
    if (pk) {
      const pkColumns = primaryKeyColumns(table.columns)
      buffer.push(`\tPRIMARY KEY (${formatNames(pkColumns, '"')})`)
    }
    buffer.push(`);`)
  }

  private formatColumn (column: Column, isComma: boolean, spaceSize: MaxLength, buffer: string[]) {
    const stringBuffer: string[] = []
    stringBuffer.push(`\t"${column.name}"` + formatSpace(spaceSize.name - column.name.length))
    stringBuffer.push(`${column.dataType}` + formatSpace(spaceSize.dataType - column.dataType.length))
    if (column.option.notNull) {
      stringBuffer.push(`NOT NULL`)
    }
    if (column.option.unique) {
      stringBuffer.push(`UNIQUE`)
    } else {
      if (column.default.trim() !== '') {
        stringBuffer.push(`DEFAULT ${column.default}`)
      }
    }
    buffer.push(stringBuffer.join(' ') + `${isComma ? ',' : ''}`)
  }

  private formatComment (name: string, table: Table, buffer: string[]) {
    if (table.comment.trim() !== '') {
      buffer.push(`COMMENT ON TABLE "${name}"."${table.name}" IS '${table.comment}';`)
      buffer.push('')
    }
    table.columns.forEach((column) => {
      if (column.comment.trim() !== '') {
        buffer.push(`COMMENT ON COLUMN "${name}"."${table.name}"."${column.name}" IS '${column.comment}';`)
        buffer.push('')
      }
    })
  }

  private formatRelation (name: string, tables: Table[], relationship: Relationship, buffer: string[]) {
    const startTable = getData(tables, relationship.start.tableId)
    const endTable = getData(tables, relationship.end.tableId)

    if (startTable && endTable) {
      buffer.push(`ALTER TABLE "${name}"."${endTable.name}"`)

      // FK 중복 처리
      let fkName = `FK_${startTable.name}_TO_${endTable.name}`
      fkName = autoName(this.fkNames, '', fkName)
      this.fkNames.push({
        id: uuid(),
        name: fkName
      })

      buffer.push(`\tADD CONSTRAINT "${fkName}"`)

      // key
      const columns: KeyColumn = {
        start: [],
        end: []
      }
      relationship.end.columnIds.forEach((columnId) => {
        const column = getData(endTable.columns, columnId)
        if (column) {
          columns.end.push(column)
        }
      })
      relationship.start.columnIds.forEach((columnId) => {
        const column = getData(startTable.columns, columnId)
        if (column) {
          columns.start.push(column)
        }
      })

      buffer.push(`\t\tFOREIGN KEY (${formatNames(columns.end, '"')})`)
      buffer.push(`\t\tREFERENCES "${name}"."${startTable.name}" (${formatNames(columns.start, '"')});`)
    }
  }
}

export default new PostgreSQL()
