CLASS lhc_gateentrylines DEFINITION INHERITING FROM cl_abap_behavior_handler.

  PRIVATE SECTION.

    METHODS updateLines FOR DETERMINE ON SAVE
      IMPORTING keys FOR GateEntryLines~updateLines.
    METHODS calculateTotals FOR DETERMINE ON MODIFY
      IMPORTING keys FOR GateEntryLines~calculateTotals.

     METHODS precheck_create_lines FOR PRECHECK
      IMPORTING entities FOR UPDATE GateEntryLines.

ENDCLASS.
CLASS lhc_gateentrylines IMPLEMENTATION.

  METHOD updateLines.
*    READ ENTITIES OF ZR_GateEntryHeader IN LOCAL MODE
*      ENTITY GateEntryLines
*      FIELDS ( PartyCode Remarks )
*      WITH CORRESPONDING #( keys )
*      RESULT DATA(entrylines).
*
*    LOOP AT entrylines INTO DATA(entryline).
*      IF entryline-PartyCode NE '' AND entryline-Remarks = ''.
*        MODIFY ENTITIES OF ZR_GateEntryHeader IN LOCAL MODE
*          ENTITY GateEntryLines
*          UPDATE
*          FIELDS ( Remarks ) WITH VALUE #( ( %tky = entryline-%tky Remarks = entryline-PartyCode ) ).
*      ENDIF.
*    ENDLOOP.


  ENDMETHOD.

  METHOD precheck_create_lines.
    loop at entities assigning FIELD-SYMBOL(<lfs_entity>).
        SELECT SINGLE FROM ZR_GateEntryHeader
        FIELDS EntryType, Plant
        WHERE GateEntryNo = @<lfs_entity>-GateEntryNo
        INTO @DATA(HeaderType).

            IF <lfs_entity>-Plant = ''.
                APPEND VALUE #( %tky = <lfs_entity>-%tky ) to failed-gateentrylines.

                APPEND VALUE #( %msg = new_message_with_text(
                                  severity = if_abap_behv_message=>severity-error
                                  text = 'Plant is Mandatory.' )
                                  ) to reported-gateentrylines.
            ELSEIF <lfs_entity>-Plant NE HeaderType-Plant.
                APPEND VALUE #( %tky = <lfs_entity>-%tky ) to failed-gateentrylines.

                APPEND VALUE #( %msg = new_message_with_text(
                                  severity = if_abap_behv_message=>severity-error
                                  text = 'Plant is Different.' )
                                  ) to reported-gateentrylines.

            ELSEIF <lfs_entity>-DocumentNo = '' and HeaderType-EntryType = 'PUR'.
                 APPEND VALUE #( %tky = <lfs_entity>-%tky ) to failed-gateentrylines.

                APPEND VALUE #(  %msg = new_message_with_text(
                                  severity = if_abap_behv_message=>severity-error
                                  text = 'Document No. is Blank.' )
                                  ) to reported-gateentrylines.
            ELSEIF ( <lfs_entity>-GateQty > <lfs_entity>-BalQty OR <lfs_entity>-InQty > <lfs_entity>-BalQty ) AND <lfs_entity>-DocumentNo NE ''.
                 APPEND VALUE #( %tky = <lfs_entity>-%tky ) to failed-gateentrylines.

                APPEND VALUE #(  %msg = new_message_with_text(
                                  severity = if_abap_behv_message=>severity-error
                                  text = 'Gate Qty Cannot greater than Balance Qty.' )
                                  ) to reported-gateentrylines.
            ELSEIF <lfs_entity>-DocumentNo NE ''.
                SELECT SINGLE FROM ZI_DocumentVH
                FIELDS EntryType
                WHERE DocumentNo = @<lfs_entity>-DocumentNo AND DocumentItemNo = @<lfs_entity>-DocumentItemNo
                INTO @DATA(LineType).

                IF LineType NE HeaderType-EntryType.
                    APPEND VALUE #( %tky = <lfs_entity>-%tky ) to failed-gateentrylines.

                    APPEND VALUE #(  %msg = new_message_with_text(
                                      severity = if_abap_behv_message=>severity-error
                                      text = 'Entry Type DIfferent for Document.' )
                                      ) to reported-gateentrylines.
                ENDIF.

            ENDIF.
     ENDLOOP.
  ENDMETHOD.


  METHOD calculateTotals.
    READ ENTITIES OF ZR_GateEntryHeader IN LOCAL MODE
        ENTITY GateEntryLines
        FIELDS ( Gateentryno GateQty Rate InQty )
         WITH CORRESPONDING #( keys )
         RESULT DATA(lt_gateentry).

      Data gateEntryNo Type ZR_GateEntryHeader-GateEntryNo.
      LOOP AT Keys into DATA(Key).
        gateEntryNo = key-GateEntryNo.
      ENDLOOP.

       select Single from ZR_GateEntryHeader
          fields EntryType
            where GateEntryNo = @gateEntryNo
            into @DATA(header).

     loop at lt_gateentry INTO DATA(exportline).

        if header = 'RGP-IN' or header = 'WREF'.
          MODIFY ENTITIES OF ZR_GateEntryHeader IN LOCAL MODE
            ENTITY GateEntryLines
            UPDATE
            FIELDS ( GateValue ) WITH VALUE #( ( %tky = exportline-%tky
                         GateValue = exportline-InQty * exportline-Rate
                          ) ).
        ELSE.
          MODIFY ENTITIES OF ZR_GateEntryHeader IN LOCAL MODE
            ENTITY GateEntryLines
            UPDATE
            FIELDS ( GateValue ) WITH VALUE #( ( %tky = exportline-%tky
                         GateValue = exportline-GateQty * exportline-Rate
                          ) ).
        ENDIF.

     ENDLOOP.
  ENDMETHOD.

ENDCLASS.

*"* use this source file for the definition and implementation of
*"* local helper classes, interface definitions and type
*"* declarations
