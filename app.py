import streamlit as st
import base64
import json
import os
from PIL import Image
import io
import re
import pandas as pd  # 添加pandas用于数据处理

st.set_page_config(
    page_title="SillyTavern 角色卡转换工具",
    page_icon="🎭",
    layout="wide"
)

# 添加自定义CSS以改进JSON显示
st.markdown("""
<style>
.json-tree {
    font-family: monospace;
    background-color: #f0f5ff;
    border-radius: 5px;
    padding: 10px;
    overflow: auto;
    border: 1px solid #d0d9e5;
}
.json-key {
    color: #d73a49;
    font-weight: 500;
}
.json-value-string {
    color: #22863a;
}
.json-value-number {
    color: #005cc5;
}
.json-value-boolean {
    color: #6f42c1;
}
.json-value-null {
    color: #6a737d;
}
.json-expander {
    cursor: pointer;
    user-select: none;
}
details > summary {
    background-color: #4a76c7;
    padding: 3px 8px;
    border-radius: 4px;
    margin: 3px 0;
    display: inline-block;
    color: white;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
details > summary:hover {
    background-color: #3a66b7;
}
details > summary > span {
    color: white;
}
details > summary > strong {
    color: #e9f0ff;
}
.expanded::before {
    content: "▼ ";
    color: white;
}
.collapsed::before {
    content: "▶ ";
    color: white;
}
details {
    margin: 5px 0;
}
</style>
""", unsafe_allow_html=True)

st.title("SillyTavern 角色卡转换工具")
st.markdown("这个工具可以帮助您在PNG角色卡与JSON文件之间进行转换，并允许您编辑角色卡内容。")

# 新增JSON可视化功能
def render_json_tree(json_data, expanded=False):
    """渲染JSON树形结构"""
    if isinstance(json_data, dict):
        return render_json_object(json_data, expanded)
    elif isinstance(json_data, list):
        return render_json_array(json_data, expanded)
    else:
        return render_json_value(json_data)

def render_json_object(json_obj, expanded=False):
    """渲染JSON对象"""
    if not json_obj:
        return '<span class="json-value-null">{}</span>'
    
    expand_class = "expanded" if expanded else "collapsed"
    html = f'''<details {"open" if expanded else ""}>
        <summary class="json-expander {expand_class}"><span>对象</span> <strong>({len(json_obj)}个字段)</strong></summary>
        <div style="margin-left: 20px;">'''
    
    for key, value in json_obj.items():
        key_safe = key.replace('"', '&quot;')
        html += f'<div style="margin: 4px 0"><span class="json-key">\'{key_safe}\'</span>: {render_json_tree(value, False)}</div>'
    
    html += '</div></details>'
    return html

def render_json_array(json_array, expanded=False):
    """渲染JSON数组"""
    if not json_array:
        return '<span class="json-value-null">[]</span>'
    
    expand_class = "expanded" if expanded else "collapsed"
    html = f'''<details {"open" if expanded else ""}>
        <summary class="json-expander {expand_class}"><span>数组</span> <strong>({len(json_array)}项)</strong></summary>
        <div style="margin-left: 20px;">'''
    
    for i, item in enumerate(json_array):
        html += f'<div style="margin: 4px 0"><span class="json-key">{i}</span>: {render_json_tree(item, False)}</div>'
    
    html += '</div></details>'
    return html

def render_json_value(value):
    """渲染JSON值"""
    if isinstance(value, str):
        # 如果是多行文本，显示部分并可展开
        if len(value) > 100 or '\n' in value:
            preview = value[:50] + "..." if len(value) > 50 else value
            preview_safe = preview.replace('"', '&quot;').replace('\n', '<br/>')
            value_safe = value.replace('"', '&quot;').replace('\n', '<br/>')
            return f'''<details>
                <summary class="json-expander collapsed"><span>字符串</span> <strong>({len(value)}个字符)</strong></summary>
                <div style="margin-left: 20px;padding: 5px;background-color: #f8f8f8;border-radius: 3px;">
                    <span class="json-value-string">"{preview_safe}"</span>
                    <div style="margin-top: 5px;border-top: 1px solid #ddd;padding-top: 5px;">
                        <span class="json-value-string">"{value_safe}"</span>
                    </div>
                </div>
            </details>'''
        value_safe = value.replace('"', '&quot;')
        return f'<span class="json-value-string">"{value_safe}"</span>'
    elif isinstance(value, bool):
        return f'<span class="json-value-boolean"><strong>{str(value).lower()}</strong></span>'
    elif isinstance(value, (int, float)):
        return f'<span class="json-value-number"><strong>{value}</strong></span>'
    elif value is None:
        return '<span class="json-value-null">null</span>'
    else:
        value_safe = str(value).replace('"', '&quot;')
        return f'<span class="json-value-string">"{value_safe}"</span>'

# 表格视图功能
def json_to_table(json_data, parent_key=""):
    """将JSON数据转换为表格格式"""
    rows = []
    
    if isinstance(json_data, dict):
        for key, value in json_data.items():
            current_key = f"{parent_key}.{key}" if parent_key else key
            
            if isinstance(value, (dict, list)):
                rows.extend(json_to_table(value, current_key))
            else:
                rows.append({"路径": current_key, "类型": type(value).__name__, "值": str(value)})
    
    elif isinstance(json_data, list):
        for i, item in enumerate(json_data):
            current_key = f"{parent_key}[{i}]"
            
            if isinstance(item, (dict, list)):
                rows.extend(json_to_table(item, current_key))
            else:
                rows.append({"路径": current_key, "类型": type(item).__name__, "值": str(item)})
    
    return rows

# 功能函数

def extract_chunks(png_data):
    """从PNG图像数据中提取所有数据块"""
    chunks = []
    pos = 8  # Skip PNG signature
    
    while pos < len(png_data):
        chunk_size = int.from_bytes(png_data[pos:pos+4], byteorder='big')
        chunk_type = png_data[pos+4:pos+8].decode('ascii')
        chunk_data = png_data[pos+8:pos+8+chunk_size]
        
        chunks.append({
            'type': chunk_type,
            'data': chunk_data
        })
        
        pos += chunk_size + 12  # Size (4) + Type (4) + Data (chunk_size) + CRC (4)
    
    return chunks

def extract_character_data(png_data):
    """从PNG数据中提取角色数据"""
    chunks = extract_chunks(png_data)
    character_data = None
    
    for chunk in chunks:
        if chunk['type'] == 'tEXt':
            # 尝试解析tEXt块
            text_data = chunk['data']
            keyword_end = text_data.find(0)  # NULL byte separates keyword and text
            if keyword_end > 0:
                keyword = text_data[:keyword_end].decode('ascii').lower()
                if keyword in ['chara', 'ccv3']:
                    text_content = text_data[keyword_end+1:]
                    # Base64解码
                    decoded_text = base64.b64decode(text_content).decode('utf-8')
                    character_data = decoded_text
                    if keyword == 'ccv3':  # 优先使用ccv3格式
                        break
    
    return character_data

def encode_chunk(chunk_type, chunk_data):
    """将块类型和数据编码为PNG块"""
    import struct
    import zlib
    
    # 计算CRC
    crc = zlib.crc32(chunk_type.encode('ascii'))
    crc = zlib.crc32(chunk_data, crc) & 0xffffffff
    
    # 组装块
    chunk = struct.pack("!I", len(chunk_data))  # 长度
    chunk += chunk_type.encode('ascii')         # 类型
    chunk += chunk_data                        # 数据
    chunk += struct.pack("!I", crc)             # CRC
    
    return chunk

def create_character_card(image_data, character_json):
    """创建角色卡，将JSON数据嵌入PNG图像"""
    # 读取原始PNG数据
    png_data = bytearray(image_data)
    
    # PNG签名
    signature = b'\x89PNG\r\n\x1a\n'
    
    if png_data[:8] != signature:
        st.error("提供的图像不是有效的PNG格式")
        return None
    
    # 提取IHDR块和其他非IEND块
    chunks = extract_chunks(png_data)
    output = bytearray(signature)
    
    # 添加IHDR和其他所有非IEND和非tEXt(chara/ccv3)块
    for chunk in chunks:
        if chunk['type'] != 'IEND' and not (chunk['type'] == 'tEXt' and 
            (chunk['data'].startswith(b'chara\x00') or chunk['data'].startswith(b'ccv3\x00'))):
            # 重新构建此块
            size = len(chunk['data'])
            output.extend(size.to_bytes(4, byteorder='big'))
            output.extend(chunk['type'].encode('ascii'))
            output.extend(chunk['data'])
            # 重新计算CRC
            import zlib
            crc = zlib.crc32(chunk['type'].encode('ascii'))
            crc = zlib.crc32(chunk['data'], crc)
            output.extend(crc.to_bytes(4, byteorder='big'))
    
    # 创建v2格式tEXt块
    base64_data_v2 = base64.b64encode(character_json.encode('utf-8'))
    text_data_v2 = b'chara\x00' + base64_data_v2
    output.extend(encode_chunk('tEXt', text_data_v2))
    
    # 尝试创建v3格式tEXt块
    try:
        char_data = json.loads(character_json)
        v3_data = char_data.copy()
        v3_data['spec'] = 'chara_card_v3'
        v3_data['spec_version'] = '3.0'
        base64_data_v3 = base64.b64encode(json.dumps(v3_data).encode('utf-8'))
        text_data_v3 = b'ccv3\x00' + base64_data_v3
        output.extend(encode_chunk('tEXt', text_data_v3))
    except:
        # 如果JSON解析失败，跳过v3格式
        pass
    
    # 添加IEND块
    output.extend(encode_chunk('IEND', b''))
    
    # 将bytearray转换为bytes，以便streamlit可以处理
    return bytes(output)

def extract_png_image(png_data):
    """从PNG数据中提取图像，去除角色卡数据"""
    # 提取PNG块
    chunks = extract_chunks(png_data)
    
    # PNG签名
    signature = b'\x89PNG\r\n\x1a\n'
    output = bytearray(signature)
    
    # 添加所有非tEXt(chara/ccv3)块
    for chunk in chunks:
        if not (chunk['type'] == 'tEXt' and 
               (chunk['data'].startswith(b'chara\x00') or chunk['data'].startswith(b'ccv3\x00'))):
            # 重建块
            size = len(chunk['data'])
            output.extend(size.to_bytes(4, byteorder='big'))
            output.extend(chunk['type'].encode('ascii'))
            output.extend(chunk['data'])
            # 重新计算CRC
            import zlib
            crc = zlib.crc32(chunk['type'].encode('ascii'))
            crc = zlib.crc32(chunk['data'], crc)
            output.extend(crc.to_bytes(4, byteorder='big'))
    
    # 将bytearray转换为bytes
    return bytes(output)

def find_and_replace(json_data, search_text, replace_text):
    """在JSON数据中查找并替换文本"""
    # 将JSON字符串转换为字符串，执行替换，然后转回JSON
    json_str = json.dumps(json_data, ensure_ascii=False)
    replaced_str = json_str.replace(search_text, replace_text)
    return json.loads(replaced_str)

def remove_creatorcomment(json_data):
    """删除JSON数据中的creatorcomment字段内容"""
    if isinstance(json_data, dict):
        if 'creatorcomment' in json_data:
            json_data['creatorcomment'] = ''
        # 检查data字段
        if 'data' in json_data and isinstance(json_data['data'], dict):
            if 'creator_notes' in json_data['data']:
                json_data['data']['creator_notes'] = ''
    return json_data

def remove_creator_info(json_data):
    """删除JSON数据中与原作者相关的所有字段内容"""
    if isinstance(json_data, dict):
        # 主级别字段
        creator_fields = ['creatorcomment', 'creator', 'create_date']
        for field in creator_fields:
            if field in json_data:
                if field == 'create_date':
                    # 将创建日期替换为当前日期，而不是清空
                    from datetime import datetime
                    json_data[field] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    json_data[field] = ''
        
        # data子对象中的字段
        if 'data' in json_data and isinstance(json_data['data'], dict):
            data_creator_fields = ['creator_notes', 'creator', 'character_version'，'declaration']
            for field in data_creator_fields:
                if field in json_data['data']:
                    json_data['data'][field] = ''
    
    return json_data

# 创建选项卡
tab1, tab2, tab3 = st.tabs(["PNG转JSON", "JSON转PNG", "编辑角色卡"])

with tab1:
    st.header("从PNG角色卡提取JSON数据")
    
    uploaded_file = st.file_uploader("上传PNG角色卡", type=["png"], key="png_upload_1")
    
    if uploaded_file is not None:
        # 显示上传的图像，使用列布局限制宽度
        col1, col2 = st.columns([1, 2])  # 创建两列布局，左列较窄用于显示图像
        with col1:
            image = Image.open(uploaded_file)
            st.image(image, caption="上传的角色卡图片", width=300)
        
        # 读取文件数据
        file_data = uploaded_file.getvalue()
        
        # 提取角色数据
        character_data = extract_character_data(file_data)
        
        if character_data:
            st.success("成功从PNG中提取角色数据！")
            
            # 尝试解析为JSON以便格式化显示
            try:
                char_json = json.loads(character_data)
                formatted_json = json.dumps(char_json, indent=2, ensure_ascii=False)
                
                # 显示JSON（增强可视化）
                with st.expander("查看JSON数据", expanded=True):
                    # 创建切换选项卡
                    json_tabs = st.tabs(["树形视图", "表格视图", "原始JSON"])
                    
                    # 树形视图
                    with json_tabs[0]:
                        st.markdown(f"<div class='json-tree'>{render_json_tree(char_json, True)}</div>", unsafe_allow_html=True)
                    
                    # 表格视图
                    with json_tabs[1]:
                        table_data = json_to_table(char_json)
                        if table_data:
                            df = pd.DataFrame(table_data)
                            st.dataframe(df, use_container_width=True)
                        else:
                            st.info("无法将此JSON转换为表格视图")
                    
                    # 原始JSON
                    with json_tabs[2]:
                        st.code(formatted_json, language="json")
                
                # 提供下载
                st.download_button(
                    label="下载JSON文件",
                    data=formatted_json,
                    file_name=f"{char_json.get('name', 'character')}.json",
                    mime="application/json"
                )
                
                # 提供下载纯图像
                pure_image = extract_png_image(file_data)
                if pure_image:
                    st.download_button(
                        label="下载纯PNG图像",
                        data=pure_image,
                        file_name=f"{char_json.get('name', 'character')}_image.png",
                        mime="image/png"
                    )
            except json.JSONDecodeError:
                st.error("提取的数据不是有效的JSON格式")
        else:
            st.error("无法从PNG中提取角色数据，可能不是SillyTavern角色卡")

with tab2:
    st.header("将JSON数据转换为PNG角色卡")
    
    # JSON输入区域
    col1, col2 = st.columns(2)
    
    with col1:
        json_input = st.text_area("输入JSON数据", height=300, key="json_input_2")
        uploaded_json = st.file_uploader("或上传JSON文件", type=["json"], key="json_file_2")
        
        if uploaded_json is not None:
            json_input = uploaded_json.getvalue().decode('utf-8')
            st.success("成功加载JSON文件！")
    
    with col2:
        uploaded_image = st.file_uploader("上传要用作角色卡的图片", type=["png", "jpg", "jpeg"], key="image_upload_2")
        
        if uploaded_image is not None:
            image = Image.open(uploaded_image)
            st.image(image, caption="角色卡图片", use_column_width=True)
    
    if st.button("生成角色卡") and json_input and uploaded_image:
        try:
            # 解析JSON以验证其有效性
            char_json = json.loads(json_input)
            
            # 确保图像是PNG格式
            image = Image.open(uploaded_image)
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            
            # 创建角色卡
            card_data = create_character_card(img_byte_arr, json_input)
            
            if card_data:
                # 提供下载
                character_name = char_json.get('name', 'character')
                st.success(f"成功创建角色卡：{character_name}.png")
                st.download_button(
                    label="下载PNG角色卡",
                    data=card_data,
                    file_name=f"{character_name}.png",
                    mime="image/png"
                )
            else:
                st.error("创建角色卡失败")
                
        except json.JSONDecodeError:
            st.error("JSON数据格式无效，请检查您的输入")
        except Exception as e:
            st.error(f"发生错误：{str(e)}")

with tab3:
    st.header("编辑角色卡")
    
    # 第一步：上传现有角色卡
    uploaded_card = st.file_uploader("上传PNG角色卡", type=["png"], key="png_upload_3")
    
    if uploaded_card:
        # 获取上传文件名，用于检查是否上传了新文件
        current_file_name = uploaded_card.name
        
        # 检查是否需要重置会话状态
        if 'current_file_name' not in st.session_state or st.session_state.current_file_name != current_file_name:
            # 新文件上传，重置会话状态
            for key in ['edited_char_data', 'original_image', 'current_image', 'current_file_name']:
                if key in st.session_state:
                    del st.session_state[key]
            
            # 记录当前文件名
            st.session_state.current_file_name = current_file_name
            
            # 读取文件数据
            file_data = uploaded_card.getvalue()
            
            # 提取角色数据
            character_data = extract_character_data(file_data)
            
            if character_data:
                try:
                    # 解析为JSON对象
                    char_json = json.loads(character_data)
                    st.session_state.edited_char_data = char_json
                    st.session_state.original_image = extract_png_image(file_data)
                    st.session_state.current_image = st.session_state.original_image
                    st.success("成功导入角色卡！")
                except json.JSONDecodeError:
                    st.error("提取的数据不是有效的JSON格式")
            else:
                st.error("无法从PNG中提取角色数据，可能不是SillyTavern角色卡")
        
        # 显示当前状态
        if 'edited_char_data' in st.session_state:
            # 显示当前图像
            st.subheader("角色卡图像")
            col1, col2 = st.columns([1, 2])  # 创建两列布局，左列较窄用于显示图像
            with col1:
                image = Image.open(io.BytesIO(st.session_state.current_image))
                # 限制图像显示宽度为300像素
                st.image(image, caption="当前角色卡图像", width=300)
            
            # 选择替换图像
            st.subheader("替换图像")
            new_image = st.file_uploader("上传新的角色卡图像", type=["png", "jpg", "jpeg"], key="new_image_3")
            if new_image:
                # 更新当前图像
                image = Image.open(new_image)
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                st.session_state.current_image = img_byte_arr.getvalue()
                st.success("图像已更新！")
                
                # 添加一个重新加载按钮
                if st.button("刷新预览"):
                    # 这个按钮不需要做任何事情，点击后Streamlit会自动重新运行应用
                    pass

            # 显示当前JSON数据
            st.subheader("编辑JSON数据")
            
            # 关键词替换
            st.write("查找并替换文本")
            col1, col2 = st.columns(2)
            with col1:
                search_text = st.text_input("查找文本", key="search_text")
            with col2:
                replace_text = st.text_input("替换为", key="replace_text")
            
            if st.button("执行替换") and search_text:
                # 执行替换
                st.session_state.edited_char_data = find_and_replace(
                    st.session_state.edited_char_data, search_text, replace_text
                )
                st.success(f"已将 '{search_text}' 替换为 '{replace_text}'")
            
            # 删除creatorcomment
            if st.button("清空creator相关信息"):
                # 删除与creator相关的所有字段
                st.session_state.edited_char_data = remove_creator_info(st.session_state.edited_char_data)
                st.success("已清空所有与原作者相关的信息")
            
            # 显示当前JSON（增强可视化）
            with st.expander("查看当前JSON数据", expanded=False):
                formatted_json = json.dumps(st.session_state.edited_char_data, indent=2, ensure_ascii=False)
                
                # 创建切换选项卡
                json_tabs = st.tabs(["树形视图", "表格视图", "原始JSON"])
                
                # 树形视图
                with json_tabs[0]:
                    st.markdown(f"<div class='json-tree'>{render_json_tree(st.session_state.edited_char_data, True)}</div>", unsafe_allow_html=True)
                
                # 表格视图
                with json_tabs[1]:
                    table_data = json_to_table(st.session_state.edited_char_data)
                    if table_data:
                        df = pd.DataFrame(table_data)
                        st.dataframe(df, use_container_width=True)
                    else:
                        st.info("无法将此JSON转换为表格视图")
                
                # 原始JSON
                with json_tabs[2]:
                    st.code(formatted_json, language="json")
            
            # 直接编辑JSON
            st.write("直接编辑JSON")
            json_text = st.text_area(
                "编辑JSON", 
                value=json.dumps(st.session_state.edited_char_data, indent=2, ensure_ascii=False),
                height=300
            )
            
            if st.button("应用JSON编辑"):
                try:
                    # 更新JSON
                    st.session_state.edited_char_data = json.loads(json_text)
                    st.success("JSON数据已更新！")
                except json.JSONDecodeError as e:
                    st.error(f"JSON格式错误: {str(e)}")
            
            # 导出修改后的角色卡
            st.subheader("导出修改后的角色卡")
            if st.button("生成修改后的角色卡"):
                try:
                    # 创建角色卡
                    json_data = json.dumps(st.session_state.edited_char_data)
                    card_data = create_character_card(st.session_state.current_image, json_data)
                    
                    if card_data:
                        # 提供下载
                        character_name = st.session_state.edited_char_data.get('name', 'character')
                        st.success(f"成功创建角色卡：{character_name}.png")
                        st.download_button(
                            label="下载修改后的角色卡",
                            data=card_data,
                            file_name=f"{character_name}.png",
                            mime="image/png",
                            key="download_final"
                        )
                    else:
                        st.error("创建角色卡失败")
                        
                except Exception as e:
                    st.error(f"发生错误：{str(e)}")
            
            # 重置按钮
            if st.button("重置"):
                # 清除会话状态
                for key in ['edited_char_data', 'original_image', 'current_image']:
                    if key in st.session_state:
                        del st.session_state[key]
                st.experimental_rerun()

st.markdown("---")
st.markdown("### 关于本工具")
st.markdown("""
这个工具基于SillyTavern的角色卡转换机制，支持以下功能：
- 从PNG角色卡中提取JSON数据
- 将JSON数据嵌入PNG图像创建角色卡
- 编辑角色卡：替换图片、修改JSON数据、查找替换文本、清空creator相关信息

该工具支持SillyTavern使用的角色卡格式，包括v2(chara)和v3(ccv3)格式。
""") 