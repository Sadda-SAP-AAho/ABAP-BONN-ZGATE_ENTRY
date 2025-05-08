CLASS lhc_gateentrylines DEFINITION INHERITING FROM cl_abap_behavior_handler.

  PRIVATE SECTION.

    METHODS updateLines FOR DETERMINE ON SAVE
      IMPORTING keys FOR GateEntryLines~updateLines.
    METHODS calculateTotals FOR DETERMINE ON MODIFY
      IMPORTING keys FOR GateEntryLines~calculateTotals.

     METHODS precheck_update_lines FOR PRECHECK
      IMPORTING entities FOR UPDATE GateEntryLines.

      METHODS validateMandatory FOR VALIDATE ON SAVE
      IMPORTING keys FOR GateEntryLines~validateMandatory.

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

  METHOD precheck_update_lines.
    LOOP AT entities ASSIGNING FIELD-SYMBOL(<lfs_entity>).
      SELECT SINGLE FROM ZR_GateEntryHeader
      FIELDS EntryType, Plant, InvoiceParty
      WHERE GateEntryNo = @<lfs_entity>-GateEntryNo
      INTO @DATA(HeaderType).

      IF <lfs_entity>-Plant = ''.
        APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

        APPEND VALUE #( %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text = 'Plant is Mandatory.' )
                          ) TO reported-gateentrylines.
      ELSEIF <lfs_entity>-Plant NE HeaderType-Plant.
        APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

        APPEND VALUE #( %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text = 'Plant is Different.' )
                          ) TO reported-gateentrylines.

      ELSEIF <lfs_entity>-DocumentNo = '' AND HeaderType-EntryType = 'PUR'.
        APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

        APPEND VALUE #(  %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text = 'Document No. is Blank.' )
                          ) TO reported-gateentrylines.
      ELSEIF ( <lfs_entity>-GateQty > ( <lfs_entity>-BalQty + <lfs_entity>-Tolerance ) OR <lfs_entity>-InQty > <lfs_entity>-BalQty ) AND <lfs_entity>-DocumentNo NE ''.
        APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

        APPEND VALUE #(  %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text = 'Gate Qty Cannot greater than Balance Qty.' )
                          ) TO reported-gateentrylines.
      ELSEIF <lfs_entity>-DocumentNo NE ''.
        SELECT SINGLE FROM ZI_DocumentVH
        FIELDS EntryType
        WHERE DocumentNo = @<lfs_entity>-DocumentNo AND DocumentItemNo = @<lfs_entity>-DocumentItemNo
        INTO @DATA(LineType).

        IF LineType NE HeaderType-EntryType.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = 'Entry Type DIfferent for Document.' )
                            ) TO reported-gateentrylines.
        ENDIF.

      ENDIF.

      DATA(lv_lineParty) = |{ <lfs_entity>-PartyCode ALPHA = IN }|.
      CONCATENATE '00' HeaderType-InvoiceParty INTO DATA(lv_headParty).


      SELECT SINGLE FROM I_Supplier
      FIELDS BusinessPartnerPanNumber
      WHERE Supplier = @lv_lineParty
      INTO @DATA(Line_PAN).

      SELECT SINGLE FROM I_Supplier
      FIELDS BusinessPartnerPanNumber
      WHERE Supplier = @lv_headParty
      INTO @DATA(Header_PAN).

      IF Line_PAN NE Header_PAN.
        APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

        APPEND VALUE #(  %msg = new_message_with_text(
                          severity = if_abap_behv_message=>severity-error
                          text = 'Party PAN Number is Different.' )
                          ) TO reported-gateentrylines.
      ENDIF.


      SELECT SINGLE FROM ZR_GateEntryLines
      FIELDS DocumentNo, DocumentItemNo, PartyCode, PartyName, ProductCode, ProductDesc, Plant, GateValue, uom
      WHERE GateEntryNo = @<lfs_entity>-GateEntryNo AND
            GateItemNo = @<lfs_entity>-GateItemNo
      INTO @DATA(Line).

      IF HeaderType-EntryType = 'PUR'.

*             check that any fields in Line is changes or not when they are initially not blank line Line-DocumnetNo is blank and Line-DocumentNo is  not equals to <lfs_entity>-DocumentNo
        IF Line-DocumentNo NE '' AND Line-DocumentNo NE <lfs_entity>-DocumentNo.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = |Cannot Update Document No. is Different.| )
                            ) TO reported-gateentrylines.
        ELSEIF Line-PartyCode NE '' AND Line-PartyCode NE <lfs_entity>-PartyCode.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = |Cannot Update Party Code is Different for { <lfs_entity>-GateItemNo }.| )
                            ) TO reported-gateentrylines.
        ELSEIF Line-PartyName NE '' AND Line-PartyName NE <lfs_entity>-PartyName.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = |Cannot Update Party Name is Different for { <lfs_entity>-GateItemNo }.| )
                            ) TO reported-gateentrylines.
        ELSEIF Line-ProductCode NE '' AND Line-ProductCode NE <lfs_entity>-ProductCode.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = |Cannot Update Product Code is Different for { <lfs_entity>-GateItemNo }.| )
                            ) TO reported-gateentrylines.
        ELSEIF Line-ProductDesc NE '' AND Line-ProductDesc NE <lfs_entity>-ProductDesc.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = |Cannot Update Product Desc is Different for { <lfs_entity>-GateItemNo }.| )
                            ) TO reported-gateentrylines.
        ELSEIF Line-Plant NE '' AND Line-Plant NE <lfs_entity>-Plant.
          APPEND VALUE #( %tky = <lfs_entity>-%tky ) TO failed-gateentrylines.

          APPEND VALUE #(  %msg = new_message_with_text(
                            severity = if_abap_behv_message=>severity-error
                            text = |Cannot Update Plant is Different for { <lfs_entity>-GateItemNo }.| )
                            ) TO reported-gateentrylines.
        ENDIF.


      ENDIF.



    ENDLOOP.
  ENDMETHOD.


   METHOD validateMandatory.
     READ ENTITIES OF ZR_GateEntryHeader IN LOCAL MODE
       ENTITY GateEntryLines
         ALL FIELDS
           WITH CORRESPONDING #( keys )
           RESULT DATA(entryheaders).

     LOOP AT entryheaders INTO DATA(entryHeader).

       SELECT SINGLE FROM ZR_GateEntryHeader
           FIELDS EntryType
           WHERE GateEntryNo = @entryHeader-GateEntryNo
           INTO @DATA(header).

       IF entryHeader-ProductCode NE '' OR entryHeader-ProductDesc NE ''.

         IF ( header = 'RGP-IN' OR header = 'WREF' ) AND entryHeader-InQty LE 0 .
           APPEND VALUE #( %tky = entryHeader-%tky ) TO failed-gateentrylines.

           APPEND VALUE #( %msg = new_message_with_text(
                             severity = if_abap_behv_message=>severity-error
                             text = 'In Qty is Mandatory.' )
                             ) TO reported-gateentrylines.
         ELSEIF entryHeader-GateQty LE 0.
           APPEND VALUE #( %tky = entryHeader-%tky ) TO failed-gateentrylines.

           APPEND VALUE #( %msg = new_message_with_text(
                               severity = if_abap_behv_message=>severity-error
                               text = 'Gate Qty is Mandatory.' )
                               ) TO reported-gateentrylines.
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
